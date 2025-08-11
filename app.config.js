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
                NSMicrophoneUsageDescription: "Vida Journal needs microphone access to record voice notes that will be transcribed into text for your private journal entries.",
                NSCameraUsageDescription: "Vida Journal needs camera access to take photos for your journal entries.",
                NSPhotoLibraryUsageDescription: "Vida Journal needs photo library access to select photos for your journal entries."
            }
        },
        android: {
            package: "com.yourcompany.vida",
            permissions: [
                "RECORD_AUDIO",
                "INTERNET",
                "CAMERA",
                "READ_EXTERNAL_STORAGE",
                "WRITE_EXTERNAL_STORAGE"
            ]
        },
        extra: {
            openaiApiKey: "" // Replace with your actual API key
        }
    }
};