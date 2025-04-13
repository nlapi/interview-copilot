<template>
  <div>

    <div class="desc_text">
      The following settings are only retained locally in your browser.
      See <a :href="github_url" target="_blank">Github</a> for setup instructions.
    </div>

    <h1>Open AI</h1>
    <div class="desc_text">To use GPT, you need an API Key from the <a :href="open_ai_api_url" target="_blank">Open
      AI</a>
    </div>

    <div>
      <el-input placeholder="sk-xxxx" v-model="openai_key" @change="onKeyChange('openai_key')">
        <template slot="prepend">API Key:</template>
      </el-input>
    </div>

    <div class="separator">
      GPT Model:
      <el-radio-group v-model="gpt_model" @change="onKeyChange('gpt_model')">
        <el-radio label="gpt-3.5-turbo"></el-radio>
        <el-radio label="gpt-4"></el-radio>
        <el-radio label="gpt-4o"></el-radio>
      </el-radio-group>
    </div>

    <div class="separator">
      <div class="desc_text">GPT Prompt:</div>
      <el-input type="textarea" placeholder="You can setup custom prompt here" :rows="5"
                v-model="gpt_system_prompt" @change="onKeyChange('gpt_system_prompt')"/>
    </div>


    <h1>Speech Recognition</h1>
    <div class="desc_text">
      We now use OpenAI's Whisper model for speech recognition. The same OpenAI API key will be used for both GPT and speech recognition.
    </div>
    
    <div class="separator">
      Speech Recognition Language:
      <el-radio-group v-model="speech_language" @change="onKeyChange('speech_language')">
        <el-radio label="en">English</el-radio>
        <el-radio label="zh">Chinese</el-radio>
        <el-radio label="ja">Japanese</el-radio>
        <el-radio label="ko">Korean</el-radio>
        <el-radio label="fr">French</el-radio>
        <el-radio label="de">German</el-radio>
        <el-radio label="es">Spanish</el-radio>
      </el-radio-group>
    </div>

<!--    <div>-->
<!--      <el-button @click="toDef">set all setting to default</el-button>-->
<!--    </div>-->

  </div>
</template>

<script>
import config_util from "../utils/config_util"

export default {
  name: 'HelloWorld',
  props: {},
  data() {
    return {
      openai_key: "",
      gpt_model: "gpt-4o",
      gpt_system_prompt: "",
      speech_language: "en",
      open_ai_api_url: "https://platform.openai.com/api-keys",
      github_url: "https://github.com/interview-copilot/Interview-Copilot"
    }
  },
  mounted() {
    this.openai_key = localStorage.getItem("openai_key")
    this.gpt_system_prompt = config_util.gpt_system_prompt()
    this.gpt_model = config_util.gpt_model()
    this.speech_language = localStorage.getItem("speech_language") || "en"
  },
  methods: {
    onKeyChange(key_name) {
      console.log("setItem", key_name, this[key_name])
      localStorage.setItem(key_name, this[key_name])
    },
    toDef() {
      localStorage.clear();
    }
  }


}


</script>
<style scoped>

.separator {
  margin-top: 10px;
}

.desc_text {
  color: gray;
  font-size: small;
  margin-bottom: 3px;
}

</style>
