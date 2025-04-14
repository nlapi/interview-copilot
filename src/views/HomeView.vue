<template>
  <div class="homeview_container">
    <div class="center_container">
      <div class="box">
        <div class="func_desc">
          <i class="el-icon-microphone"></i>
          Speech Recognition Results
        </div>
        <div v-if="!currentText" style="color: gray">No Content</div>
        <div class="asr_content">{{ currentText }}</div>
        <div class="single_part_bottom_bar">
          <el-button icon="el-icon-delete" :disabled="!currentText" @click="clearASRContent">
            Clear Text
          </el-button>
          <el-button icon="el-icon-edit" @click="showTextInputDialog">
            Manual Input
          </el-button>
        </div>
        
        <!-- Manual Text Input Dialog -->
        <el-dialog
          title="Enter or Paste Text"
          :visible.sync="textInputDialogVisible"
          width="50%">
          <el-input
            type="textarea"
            :rows="10"
            placeholder="Enter or paste your text here..."
            v-model="manualInputText">
          </el-input>
          <span slot="footer" class="dialog-footer">
            <el-button @click="textInputDialogVisible = false">Cancel</el-button>
            <el-button type="primary" @click="submitManualText">Submit</el-button>
          </span>
        </el-dialog>
      </div>
      <div class="box" style="border-left: none;">
        <div class="func_desc">
          <i class="el-icon-s-custom"></i>
          GPT Answer
        </div>
        <LoadingIcon v-show="show_ai_thinking_effect"/>
        <div class="ai_result_content">{{ ai_result }}</div>
        <div class="single_part_bottom_bar">
          <el-button icon="el-icon-thumb" @click="askCurrentText" :disabled="!isGetGPTAnswerAvailable">
            Ask GPT
          </el-button>
        </div>
      </div>
    </div>
    <div class="title_function_bar">
      <el-button
          type="success"
          @click="startCopilot" v-show="state==='end'" :loading="copilot_starting"
          :disabled="copilot_starting">Start Copilot
      </el-button>
      <el-button
          :loading="copilot_stopping"
          @click="userStopCopilot" v-show="state==='ing'">Stop Copilot
      </el-button>
      <MyTimer ref="MyTimer"/>
    </div>

  </div>
</template>

<script>
import Assert from "assert-js"
import LoadingIcon from "@/components/LoadingIcon.vue";
import MyTimer from "@/components/MyTimer.vue";
import RecordRTC from 'recordrtc';
import OpenAI from "openai";
import config_util from "../utils/config_util"

export default {
  name: 'HomeView',
  props: {},
  computed: {
    isDevMode() {
      return (process.env.NODE_ENV === 'development')
    },
    isGetGPTAnswerAvailable() {
      // return this.state === "ing" && !!this.currentText
      return !!this.currentText

    }
  },
  components: {LoadingIcon, MyTimer},
  data() {
    return {
      currentText: "",
      state: "end", //end\ing
      ai_result: null,
      copilot_starting: false, //显示loading
      copilot_stopping: false,
      show_ai_thinking_effect: false,
      popStyle: {},
      recorder: null,
      audioContext: null,
      audioChunks: [],
      isRecording: false,
      recordingInterval: null,
      silentIntervals: 0,
      transcribeTimer: null,
      textInputDialogVisible: false,
      manualInputText: ''
    }
  },
  async mounted() {
    console.log("mounted")
    if (this.isDevMode) {
      // this.currentText = demo_text
    }
    
    // Set up electron IPC listeners if running in electron
    if (window.electron) {
      console.log("App mounted")
      this.setupElectronListeners();
    }
  },
  beforeDestroy() {
    // Clean up any resources
    this.cleanupRecording();
    
    // Remove electron listeners if they exist
    if (window.electron) {
      this.removeElectronListeners();
    }
  },
  methods: {
    async askCurrentText() {
      const apiKey = localStorage.getItem("openai_key")
      let content = this.currentText
      this.ai_result = ""
      this.show_ai_thinking_effect = true
      const model = config_util.gpt_model()
      const gpt_system_prompt = config_util.gpt_system_prompt()
      content = gpt_system_prompt + "\n" + content

      try {
        if (!apiKey) {
          throw new Error("You should setup an Open AI Key!")
        }

        const openai = new OpenAI({apiKey: apiKey, dangerouslyAllowBrowser: true})
        // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        const stream = await openai.chat.completions.create({
          model: model,
          messages: [{role: "user", content: content}],
          stream: true,
        });
        this.show_ai_thinking_effect = false

        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content || ""
          this.ai_result += text
        }
      } catch (e) {
        this.show_ai_thinking_effect = false
        this.ai_result = "" + e
      }
    },
    clearASRContent() {
      this.currentText = ""
    },
    showTextInputDialog() {
      this.textInputDialogVisible = true;
      this.manualInputText = '';
    },
    submitManualText() {
      if (this.manualInputText.trim()) {
        // If there's already text, add a line break before new content
        if (this.currentText.trim()) {
          this.currentText += '\n';
        }
        // Add the manually entered text
        this.currentText += this.manualInputText.trim();
      }
      this.textInputDialogVisible = false;
    },
    async startCopilot() {
      this.copilot_starting = true;
      const openai_key = localStorage.getItem("openai_key");
      const language = config_util.speech_language();
      
      try {
        if (!openai_key) {
          throw new Error("You should setup Open AI API Token");
        }
        
        console.log("Starting RecordRTC recording...");
        
        // Get user media (microphone)
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        // Configure RecordRTC
        this.recorder = new RecordRTC(stream, {
          type: 'audio',
          mimeType: 'audio/webm',  // Use webm format which OpenAI accepts
          recorderType: RecordRTC.StereoAudioRecorder,
          numberOfAudioChannels: 1, // mono
          desiredSampRate: 16000,  // 16 kHz as preferred by Whisper
          timeSlice: 5000,  // 5 seconds segments
          ondataavailable: (blob) => {
            console.log("RecordRTC data available, blob size:", blob.size);
            if (blob.size > 0 && this.isRecording) {
              this.processAudioChunk(blob);
            }
          }
        });
        
        // Start recording
        this.recorder.startRecording();
        this.isRecording = true;
        
        // Start the UI components
        this.copilot_starting = false;
        this.state = "ing";
        this.$refs.MyTimer.start();
        window.console.log("RecordRTC recording started");
      } catch (e) {
        console.error("Failed to start recording:", e);
        this.currentText = "Start Failed: " + e.message;
        this.copilot_starting = false;
        return;
      }
    },
    
    // New method to process audio chunks
    async processAudioChunk(blob) {
      try {
        console.log("Processing audio chunk, size:", blob.size, "bytes");
        
        if (blob.size < 100) {
          console.warn("Audio blob is too small, skipping transcription");
          return;
        }
        
        // Send to OpenAI for transcription
        const apiKey = localStorage.getItem("openai_key");
        const language = config_util.speech_language();
        
        console.log("Sending audio for transcription, language:", language || "auto");
        
        const formData = new FormData();
        formData.append('file', blob, 'recording.webm');
        formData.append('model', 'whisper-1');
        if (language) {
          formData.append('language', language);
        }
        
        const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
          },
          body: formData
        });
        
        console.log("Got response from OpenAI:", response.status, response.statusText);
        
        if (!response.ok) {
          // Get detailed error information
          let errorText = response.statusText;
          try {
            const errorData = await response.json();
            console.error("Error data:", JSON.stringify(errorData));
            errorText = errorData.error?.message || errorData.message || errorText;
          } catch (e) {
            console.error("Could not parse error response:", e);
            try {
              errorText = await response.text();
              console.error("Error text:", errorText);
            } catch (e2) {
              console.error("Could not get error text:", e2);
            }
          }
          
          throw new Error(`Transcription failed (${response.status}): ${errorText}`);
        }
        
        const result = await response.json();
        console.log("Transcription result:", result);
        const text = result.text;
        
        if (text && text.trim()) {
          // Add the transcribed text to the display
          this.currentText = this.currentText ? this.currentText + " " + text : text;
          console.log("Added text to display:", text);
        } else {
          console.log("No transcription returned or empty");
        }
      } catch (error) {
        console.error('Transcription error:', error.toString());
        console.error('Error details:', error.message, error.stack);
        this.currentText += "\nError: " + error.toString();
      }
    },
    
    // We don't need the setupTranscriptionTimer anymore since RecordRTC handles this with timeSlice
    
    async userStopCopilot() {
      this.copilot_stopping = true;
      
      try {
        await this.cleanupRecording();
        
        // Update UI
        console.log("Stopped recording");
        this.copilot_stopping = false;
        this.state = "end";
        this.$refs.MyTimer.stop();
      } catch (err) {
        console.error("Error stopping recording:", err);
        this.copilot_stopping = false;
        this.state = "end";
        this.$refs.MyTimer.stop();
      }
    },
    
    async cleanupRecording() {
      console.log("Cleaning up recording resources...");
      
      // Stop recording first
      this.isRecording = false;
      
      // Clean up RecordRTC
      if (this.recorder) {
        try {
          // Stop recording but don't process the final audio as it causes duplication
          console.log("Stopping RecordRTC...");
          
          const promise = new Promise((resolve) => {
            this.recorder.stopRecording(() => {
              try {
                const blob = this.recorder.getBlob();
                console.log("Final recording blob size:", blob.size);
                
                // Note: We're skipping processing the final blob to avoid duplication
                // The audio chunks processed during recording are sufficient
                
                // Clean up recorder
                this.recorder.destroy();
                this.recorder = null;
                resolve();
              } catch (e) {
                console.error("Error in RecordRTC stop callback:", e);
                resolve();
              }
            });
          });
          
          await promise;
        } catch (e) {
          console.error("Error stopping recorder:", e);
        }
      }
      
      // Clear any timers
      if (this.transcribeTimer) {
        clearInterval(this.transcribeTimer);
        this.transcribeTimer = null;
      }
      
      // Clean up audio context
      if (this.audioContext && this.audioContext.state !== 'closed') {
        try {
          await this.audioContext.close();
          this.audioContext = null;
        } catch (e) {
          console.error("Error closing audio context:", e);
        }
      }
      
      console.log("Recording cleanup complete");
    },
    
    // Setup electron IPC event listeners for desktop app functionality
    setupElectronListeners() {
      if (!window.electron || !window.electron.ipcRenderer) {
        console.log("Electron IPC not available, skipping listener setup");
        return;
      }
      
      console.log("Setting up electron IPC listeners");
      
      // Listen for tray commands
      window.electron.ipcRenderer.on('tray-start-recording', () => {
        console.log("Received tray-start-recording command");
        if (this.state === "end") {
          this.startCopilot();
        }
      });
      
      window.electron.ipcRenderer.on('tray-stop-recording', () => {
        console.log("Received tray-stop-recording command");
        if (this.state === "ing") {
          this.userStopCopilot();
        }
      });
      
      window.electron.ipcRenderer.on('tray-ask-gpt', () => {
        console.log("Received tray-ask-gpt command");
        if (this.isGetGPTAnswerAvailable) {
          this.askCurrentText();
        }
      });
      
      // Listen for screen sharing status
      window.electron.ipcRenderer.on('screen-sharing-status', (isScreenBeingShared) => {
        console.log("Screen sharing status changed:", isScreenBeingShared);
        // We could show a notification here if needed
        if (isScreenBeingShared) {
          this.$notify({
            title: 'Screen Sharing Detected',
            message: 'The app has been automatically hidden.',
            type: 'warning',
            duration: 3000
          });
        }
      });
      
      // Listen for window visibility changes
      window.electron.ipcRenderer.on('window-visibility-change', (isVisible) => {
        console.log("Window visibility changed:", isVisible);
        // Could update UI based on visibility state
      });
    },
    
    // Remove electron IPC event listeners
    removeElectronListeners() {
      if (!window.electron || !window.electron.ipcRenderer) {
        return;
      }
      
      console.log("Removing electron IPC listeners");
      
      // Remove all listeners
      window.electron.ipcRenderer.removeAllListeners('tray-start-recording');
      window.electron.ipcRenderer.removeAllListeners('tray-stop-recording');
      window.electron.ipcRenderer.removeAllListeners('tray-ask-gpt');
      window.electron.ipcRenderer.removeAllListeners('screen-sharing-status');
      window.electron.ipcRenderer.removeAllListeners('window-visibility-change');
    }
  }
}


const demo_text = `
Hello, thank you for coming for the interview. Please introduce yourself.

I'm Jhon, currently an undergraduate student majoring in Data Science at HK University. I am in the top 10% of my class, specializing in deep learning and proficient in web development. Additionally, I have contributed to several well-known open-source projects as mentioned in my resume.

Alright, let me ask you a machine learning question.

Sure, go ahead.

Can you explain the Hidden Markov Model?
`

async function sleep(ms) {
  return new Promise((resolve => setTimeout(resolve, ms)))
}


</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

.homeview_container {
  display: flex;
  flex-direction: column;
}

.title_function_bar {
  margin-top: 10px;
  text-align: center;
  margin-bottom: 10px;
}

.center_container {
  flex-grow: 1;
  display: flex;
  height: calc(100vh - 150px);
}

.box {
  flex: 1; /* 设置flex属性为1，使两个div平分父容器的宽度 */
  border: 1px lightgray solid; /* 为了演示，添加边框样式 */
  padding: 10px; /* 为了演示，添加内边距 */
  white-space: pre-wrap;
  display: flex;
  flex-direction: column;
}

.asr_content {
  overflow-y: auto;
  flex-grow: 1;
}


.func_desc {
  text-align: center;
}

.single_part_bottom_bar {
  display: flex;
}

.single_part_bottom_bar > .el-button {
  flex-grow: 1;
}


.ai_result_content {
  overflow-y: auto;
  flex-grow: 1;
}

.popup-tag {
  position: absolute;
  display: none;
  background-color: #785448d4;
  color: white;
  padding: 5px;
  font-size: 15px;
  font-weight: bold;
  text-decoration: underline;
  cursor: pointer;
  -webkit-filter: drop-shadow(0 1px 10px rgba(113, 158, 206, 0.8));
}

.error_msg {
  color: red;
  text-align: center;
}

.el-textarea__inner {
  font-family: inherit;
  line-height: 1.5;
  font-size: 14px;
}

</style>
