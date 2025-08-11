export default {
    expo: {
      name: "Vida Journal",
      slug: "vida-journal",
      version: "1.0.0",
      orientation: "portrait",
      platforms: ["ios", "android"],
      ios: {
        bundleIdentifier: "com.yourcompany.vida",
        infoPlist: {
          NSMicrophoneUsageDescription: "Vida Journal needs microphone access to record voice notes that will be transcribed into text for your private journal entries."
        }
      },
      android: {
        package: "com.yourcompany.vida",
        permissions: ["RECORD_AUDIO", "INTERNET"]
      },
      extra: {
        openaiApiKey: "to_add_here" // Replace with your actual API key
      }
    }
  };