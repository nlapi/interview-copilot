// const def_prompt = `The following is a transcript of an interview dialogue. Please extract the last question asked by the interviewer and provide an answer. If it is an algorithm question, please provide the approach and code implementation. If no question is found, there is no need to respond.`


function gpt_system_prompt() {
    return localStorage.getItem("gpt_system_prompt")
}

function speech_language() {
    return localStorage.getItem("speech_language") || "en"
}

function gpt_model() {
    return localStorage.getItem("gpt_model") || "gpt-4o"
}

export default {
    gpt_system_prompt,
    speech_language,
    gpt_model
}