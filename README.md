# 🕵️‍♀️ TruthLens Campus

**TruthLens Campus – AI-powered Misinformation Detection for Students & Local Communities**

## 🌟 Inspiration

In today's digital-first campus environment, students heavily rely on WhatsApp groups, Telegram channels, Instagram posts, emails, and online portals for critical information such as placements, scholarships, exams, events, and local news.

Unfortunately, misinformation spreads faster than verification.

False placement messages, fake notices, manipulated images, and misleading local news often cause:
- Panic and confusion
- Financial scams
- Missed opportunities
- Loss of trust within communities

We built TruthLens Campus to give students and communities a fast, reliable, AI-powered way to verify information before believing or sharing it.

## 🎯 Problem Statement

There is no dedicated, easy-to-use verification platform focused on campus and local-community misinformation.

Existing fact-checking tools are:
- Generic
- Slow
- Not student-focused
- Lack clear explanations

Students need a simple yet intelligent system that:
- Works in real time
- Explains why content is fake or real
- Supports multiple content formats

## 💡 Our Solution

TruthLens Campus is a web-based AI verification platform powered by Google's Gemini API, designed specifically for students and local communities.

Users can submit:
- 📝 Text messages
- 🔗 URLs
- 🖼️ Images
- 📄 Documents (PDF notices, circulars, announcements)

The system analyzes the content using Gemini's advanced reasoning capabilities and returns:
- ✅ Verdict: Real / Fake / Partially True
- 📊 Confidence Score
- 🧠 AI-generated explanation
- 🔍 Contextual insights

This empowers users to understand misinformation, not just detect it.

## ✨ Key Features

### 🔍 Multi-Modal Verification
- Text and message verification
- URL and article analysis
- Image authenticity detection
- PDF & document credibility checking

### 🤖 Gemini-Powered Intelligence
- Advanced contextual reasoning
- Natural language explanations
- Confidence-based classification

### 🧠 Explainable AI
- Clear reasons behind each verdict
- Human-readable explanations
- Helps users learn and think critically

### 🔐 Secure & Scalable
- Firebase Authentication
- Cloud-based architecture
- Secure user sessions

### 🌐 Community-Centric Design
- Optimized for campus use cases
- Simple UI for non-technical users
- Designed for real-world adoption

## 🧪 How It Works (Technical Flow)

1. User submits content via the web interface
2. Content is preprocessed and validated
3. Data is securely sent to Gemini API
4. Gemini performs credibility analysis and reasoning
5. Results are returned with verdict & explanation
6. Results are stored using Firebase Firestore

## 🧠 Google Technologies Used

This project strictly follows TechSprint Hackathon requirements.

- **Gemini API** – AI reasoning & misinformation detection
- **Firebase Authentication** – Secure login
- **Firebase Firestore** – Cloud database
- **Firebase Hosting** – Web deployment
- **Google Cloud Functions** – Backend processing (extendable)

## 🏗️ System Architecture

```
User Interface
    ↓
Content Input Layer
    ↓
AI Processing (Gemini API)
    ↓
Credibility Analysis Engine
    ↓
Result Explanation Layer
    ↓
Firebase Storage & Analytics
```

## 🧰 Tech Stack

### Frontend
- React.js
- TypeScript
- Tailwind CSS

### Backend
- Node.js
- Firebase
- Google Cloud Functions

### AI / ML
- Google Gemini (LLM-based reasoning)

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Firebase account
- Google Gemini API key

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd AuthenticCreative1
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file in the root directory:
```env
GEMINI_API_KEY=your_gemini_api_key_here
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
# ... other Firebase config
```

4. Start the development server:
```bash
npm run dev
```

## 🎥 Demo & Deliverables

- 🎬 2–3 minute demo video showcasing real use cases
- 📊 Pitch deck explaining problem, solution & impact
- 💻 Working prototype (this repository)

## 🌍 Real-World Impact

- Prevents misinformation panic on campuses
- Protects students from scams
- Improves trust in shared information
- Encourages responsible digital behavior

## 🚀 Future Scope

- 🌍 Multilingual verification
- 🤝 WhatsApp / Telegram bot integration
- 🧩 Browser extension
- 📊 Community credibility scoring
- 🖼️ Advanced image forensics

## 🧑‍🤝‍🧑 Team

Developed by a passionate student team as part of **TechSprint Hackathon 2025** organized by **GDG On Campus GGITS**

## 📜 License

This project is developed for educational, research, and hackathon purposes.

## 🏁 Final Note

TruthLens is not just a project — it is a step toward safer, smarter, and more trustworthy student communities.
