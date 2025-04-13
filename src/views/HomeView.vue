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
        </div>
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
import Recorder from 'recorder-js';
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
      transcribeTimer: null
    }
  },
  async mounted() {
    console.log("mounted")
    if (this.isDevMode) {
      // this.currentText = demo_text
    }
  },
  beforeDestroy() {
    // Clean up any resources
    this.cleanupRecording();
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
    async startCopilot() {
      this.copilot_starting = true
      const openai_key = localStorage.getItem("openai_key")
      const language = config_util.speech_language()
      
      try {
        if (!openai_key) {
          throw new Error("You should setup Open AI API Token")
        }
        
        // Create audio context and recorder
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.recorder = new Recorder(this.audioContext, {
          onAnalysed: data => {
            // Optional: You can use this for visualization if needed
          }
        });

        // Get user media (microphone)
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        await this.recorder.init(stream);
        this.recorder.start();
        this.isRecording = true;
        
        // Set up continuous transcription
        this.audioChunks = [];
        this.setupTranscriptionTimer();
        
        // Start the UI components
        this.copilot_starting = false
        this.state = "ing"
        this.$refs.MyTimer.start()
        window.console.log("recognition started");
      } catch (e) {
        this.currentText = "Start Failed: " + e.message;
        this.copilot_starting = false
        return
      }
    },
    
    setupTranscriptionTimer() {
      // Transcribe every 5 seconds
      this.transcribeTimer = setInterval(async () => {
        if (this.isRecording) {
          await this.transcribeAudio();
        }
      }, 5000);
    },
    
    async transcribeAudio() {
      try {
        console.log("Starting transcription process");
        // Stop recording temporarily to get the audio data
        let buffer;
        try {
          const result = await this.recorder.stop();
          buffer = result.buffer;
          console.log("Recording stopped, got buffer:", buffer ? "Buffer received" : "No buffer");
          console.log("Buffer type:", buffer ? typeof buffer : "N/A", "Buffer length:", buffer ? buffer.length : 0);
        } catch (e) {
          console.error("Error stopping recorder:", e);
          throw new Error("Failed to get audio data: " + e.message);
        }
        
        if (!buffer || buffer.length === 0) {
          throw new Error("No audio data recorded. Please check your microphone permission and try speaking louder.");
        }
        
        // We need to properly encode the audio as a WAV file
        // First, check that we have a valid buffer
        if (!buffer || !buffer.length) {
          throw new Error("No audio data recorded");
        }
        
        // For testing purposes, let's try MP3 format instead
        // The recorder.js library should return WAV data already
        const audioBlob = new Blob([buffer], { type: 'audio/mp3' });
        console.log("Created audio blob, size:", audioBlob.size, "bytes");
        
        if (audioBlob.size < 100) {
          throw new Error("Audio recording is too small (size: " + audioBlob.size + " bytes). Please try speaking louder.");
        }
        
        // Send to OpenAI for transcription
        const apiKey = localStorage.getItem("openai_key");
        const language = config_util.speech_language();
        console.log("Using language for transcription:", language);
        
        const formData = new FormData();
        formData.append('file', audioBlob, 'recording.mp3');  // Changed filename to match the MIME type
        formData.append('model', 'whisper-1');
        if (language) {
          formData.append('language', language);
        }
        
        console.log("Sending transcription request to OpenAI");
        // Use fetch for the API call
        console.log("API Key length:", apiKey ? apiKey.length : 0);
        
        const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
          },
          body: formData
        });
        
        console.log("Got response from OpenAI:", response.status, response.statusText);
        
        if (!response.ok) {
          // Try to get more info about the error
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
          this.currentText = this.currentText ? this.currentText + "\n" + text : text;
          console.log("Added text to display:", text);
        }
        
        // Restart recording
        if (this.isRecording) {
          console.log("Restarting recording");
          await this.recorder.start();
        }
      } catch (error) {
        console.error('Transcription error:', error.toString());
        console.error('Error details:', error.message, error.stack);
        // Show error in the UI for debugging
        this.currentText += "\nError: " + error.toString();
        // Restart recording despite error
        if (this.isRecording) {
          console.log("Restarting recording after error");
          await this.recorder.start();
        }
      }
    },
    
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
      // Clear the transcription timer
      if (this.transcribeTimer) {
        clearInterval(this.transcribeTimer);
        this.transcribeTimer = null;
      }
      
      // Do one final transcription if we're recording
      if (this.isRecording && this.recorder) {
        try {
          await this.transcribeAudio();
        } catch (e) {
          console.error("Error during final transcription:", e);
        }
      }
      
      // Stop recording
      this.isRecording = false;
      if (this.recorder) {
        try {
          await this.recorder.stop();
        } catch (e) {
          console.error("Error stopping recorder:", e);
        }
      }
      
      // Clean up audio context
      if (this.audioContext && this.audioContext.state !== 'closed') {
        try {
          await this.audioContext.close();
        } catch (e) {
          console.error("Error closing audio context:", e);
        }
      }
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

</style>
