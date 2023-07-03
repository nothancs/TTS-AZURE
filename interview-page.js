var isRecording = false;
var conversationHistory = [];
var SpeechSDK;
var phraseDiv;
var result;
var synthesizer;

function startRecording() {
  const muteButton = document.getElementById("mute-button");
  result = document.querySelector(".textbox-answer"); // Assign the result variable

  result.value = "";

  if (!isRecording) {
    muteButton.classList.remove("bi-mic-mute");
    muteButton.classList.add("bi-mic");

    isRecording = true;

    var subscriptionKey = "0bc6458950df404dbaf6b79d55835e94";
    var serviceRegion = "westus";

    var speechConfig = SpeechSDK.SpeechConfig.fromSubscription(subscriptionKey, serviceRegion);
    speechConfig.speechRecognitionLanguage = "en-US";
    var audioConfig = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput();
    var recognizer = new SpeechSDK.SpeechRecognizer(speechConfig, audioConfig);

    recognizer.recognizing = function (s, e) {
      result.value = e.result.text;
    };

    recognizer.recognizeOnceAsync(
      function (speechResult) {
        isRecording = false;
        muteButton.classList.remove("bi-mic");
        muteButton.classList.add("bi-mic-mute");
        result.value = speechResult.text;
        submitText();
      },
      function (err) {
        isRecording = false;
        muteButton.classList.remove("bi-mic");
        muteButton.classList.add("bi-mic-mute");
        console.log(err);
      }
    );
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const firstMessage = { role: "user", content: "Please begin by introducing yourself and asking me my name." };
  const currentConversation = [firstMessage];

  fetch("http://localhost:3000", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messages: currentConversation,
    }),
  })
    .then((res) => res.json())
    .then((data) => {
      console.log("Response:", data);
      const assistantResponse = data.completion.content;
      console.log("Assistant Response:", assistantResponse);

      const firstAssistantResponse = { role: "assistant", content: assistantResponse };
      conversationHistory = [firstMessage, firstAssistantResponse];

      displayTypingEffect(assistantResponse);
      
    })
    .catch((error) => {
      console.error("Error:", error);
    });
}, { once: true });

function submitText() {
  const userInput = document.querySelector(".textbox-answer").value;
  const userMessage = { role: "user", content: userInput };
  const currentConversation = [...conversationHistory, userMessage];
  console.log("submitText() called");

  fetch("http://localhost:3000", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messages: currentConversation,
    }),
  })
    .then((res) => res.json())
    .then((data) => {
      console.log("Response:", data);
      const assistantResponse = data.completion.content;
      console.log("Assistant Response:", assistantResponse);

      const botMessage = { role: "assistant", content: assistantResponse };
      conversationHistory = [...currentConversation, botMessage];

      displayTypingEffect(assistantResponse);
    })
    .catch((error) => {
      console.error("Error:", error);
    });
}

// Display typing effect for assistant response with TTS
function displayTypingEffect(message) {
  const questionInput = document.querySelector(".textbox-question");
  questionInput.value = "";

  let charIndex = 0;
  const typingInterval = setInterval(() => {
    questionInput.value += message[charIndex];
    charIndex++;
    if (charIndex === message.length) {
      clearInterval(typingInterval);
    }
  }, 25); // Delay between each character

  // Trigger TTS immediately 
  speakText(message);
}

// Check if TTS is already in progress
function isTTSInProgress() {
  return synthesizer && synthesizer.pendingSpeak;
}

// Function to trigger TTS and read out the message
function speakText(text) {
  if (!synthesizer) {
    var subscriptionKey = "0bc6458950df404dbaf6b79d55835e94";
    var serviceRegion = "westus";

    var speechConfig = SpeechSDK.SpeechConfig.fromSubscription(subscriptionKey, serviceRegion);
    speechConfig.speechSynthesisVoiceName = "en-US-AnaNeural";

    synthesizer = new SpeechSDK.SpeechSynthesizer(speechConfig);
  }

  if (!isTTSInProgress()) { // Check if TTS is already in progress
    synthesizer.speakTextAsync(
      text,
      function (result) {
        if (result.reason === SpeechSDK.ResultReason.SynthesizingAudioCompleted) {
          console.log("TTS synthesis completed for: " + text);
        } else if (result.reason === SpeechSDK.ResultReason.Canceled) {
          console.log("TTS synthesis failed. Error detail: " + result.errorDetails);
        }
      },
      function (err) {
        console.error("TTS synthesis error:", err);
      }
    );
    }
  }
