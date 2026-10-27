# SenseForge
### Monitor. Analyze. Optimize.

**SenseForge** is a web-based industrial sensor anomaly detection system that integrates Machine Learning and Big Data Analytics to analyze multisensor data, identify abnormal patterns, and evaluate data processing performance at scale.

Developed by **Group 2** as part of the Big Data 2 project, SenseForge combines data processing, machine learning-based anomaly detection, MongoDB storage, and interactive data visualization in a unified dashboard.

---

## 📌 Table of Contents

- [About the Project](#-about-the-project)
- [Objectives](#-objectives)
- [Key Features](#-key-features)
- [Sensor Parameters](#-sensor-parameters)
- [Technology Stack](#-technology-stack)
- [System Architecture](#-system-architecture)
- [Project Structure](#-project-structure)
- [System Requirements](#-system-requirements)
- [Installation and Configuration](#-installation-and-configuration)
- [Running the Application](#-running-the-application)
- [Testing and Evaluation](#-testing-and-evaluation)
- [Deployment](#-deployment)
- [Security](#-security)
- [Development Team](#-development-team)
- [Project Status](#-project-status)

---

## 📖 About the Project

Industrial machines generate sensor data that can provide insights into their operating conditions. Changes in temperature, vibration, electrical power, and acoustic patterns may indicate unusual operating behavior.

SenseForge is designed to process historical industrial sensor data, identify records that may indicate anomalies, and present analytical results through a web dashboard.

The system combines two main approaches:

- **Machine Learning:** Learns patterns from sensor data and identifies potentially anomalous observations using the selected model.
- **Big Data Analytics:** Supports data aggregation, processing at different dataset sizes, and performance evaluation of the data processing pipeline.

The project uses available datasets for analysis and testing. Real-time physical sensor monitoring is outside the scope unless a live sensor integration is explicitly implemented.

## 🎯 Objectives

1. Develop a web application for detecting anomalies in industrial machine sensor data.
2. Integrate Machine Learning into a Python-based data processing application.
3. Use MongoDB to store and retrieve sensor data and analytical results.
4. Apply Big Data Analytics to aggregate and process large datasets.
5. Visualize sensor trends, historical records, anomaly detection results, and processing performance.
6. Evaluate the system using measurable and reproducible experiments.

## ✨ Key Features

### 1. Monitoring Dashboard

Displays summaries of sensor data, operational statistics, sensor trends, and anomaly information based on available records.

### 2. Sensor Data Management

Supports data ingestion, storage, retrieval, and processing according to the implemented dataset import functionality.

### 3. Machine Learning-Based Anomaly Detection

Processes sensor features using a trained Machine Learning model to identify observations classified or flagged as anomalous.

### 4. Sensor Data Visualization

Displays changes and trends across sensor parameters to help users understand data patterns.

### 5. Historical Records and Anomaly Results

Presents historical sensor records and anomaly detection results from processed data.

### 6. Big Data Analytics

Supports aggregation and data processing performance evaluation, potentially including processing time, query latency, throughput, and other metrics implemented and measured by the project.

> Feature availability depends on the actual implementation in the repository.

## 📊 Sensor Parameters

SenseForge focuses on four primary sensor parameters:

| Parameter | Description |
|---|---|
| Temperature | Represents the machine's thermal condition. |
| Vibration | Represents the machine's vibration level. |
| Power | Represents the machine's electrical power consumption. |
| Noise / Acoustic | Represents acoustic measurements or machine noise characteristics. |

The exact units, ranges, and column names depend on the dataset being used. Dataset documentation should be consulted before preprocessing or model training.

## 🛠️ Technology Stack

| Technology | Purpose |
|---|---|
| Next.js | Frontend application and web dashboard |
| React | User interface components |
| TypeScript / JavaScript | Frontend application logic |
| Python | Backend development and data processing |
| FastAPI | REST API development |
| MongoDB Atlas | Cloud-hosted document database |
| Pandas / NumPy | Data processing, if used |
| Scikit-learn | Machine Learning model development or inference, if used |
| Joblib | Model serialization and loading, if used |
| Git and GitHub | Version control and collaboration |
| Vercel | Target deployment platform for the Next.js frontend |

## 🏗️ System Architecture

The general system workflow is as follows:

1. Sensor datasets are prepared and validated.
2. The Python backend receives and processes data according to the configured pipeline.
3. MongoDB stores and retrieves sensor records and analytical results.
4. The Machine Learning model analyzes sensor patterns and produces anomaly detection results.
5. The Big Data Analytics pipeline performs data aggregation and processing performance experiments.
6. The backend exposes the results through API endpoints.
7. The Next.js frontend retrieves and visualizes the results in the dashboard.

```text
Sensor Dataset
      |
      v
Python Backend / FastAPI
      |
      +------> MongoDB Atlas
      |
      +------> Machine Learning
      |              |
      |              v
      |       Anomaly Results
      |
      +------> Big Data Analytics
                     |
                     v
             Aggregation Results
             and Benchmarks
                     |
                     v
                  REST API
                     |
                     v
             Next.js Dashboard
```

This diagram represents the conceptual architecture. The actual execution flow depends on the implementation in the source code.

## 📁 Project Structure

The following is an illustrative project structure based on the repository layout. File names and directories should be adjusted to match the actual codebase.

```text
Web/
├── app/                    # Next.js pages and routing
├── backend/                # Python / FastAPI backend
│   ├── main.py             # Example entry point
│   ├── requirements.txt    # Example Python dependencies
│   └── ...                 # Models, routes, services, analytics
├── components/             # Reusable UI components
├── lib/                    # Utilities and helper functions
├── public/                 # Static assets
├── .gitignore
├── package.json
├── package-lock.json
├── next.config.ts
├── tsconfig.json
└── README.md
```

## 💻 System Requirements

The development environment should include:

- Node.js compatible with the project's Next.js version.
- npm or the package manager used by the project.
- A Python version compatible with the backend dependencies.
- Git and GitHub Desktop for version control.
- A MongoDB Atlas account and configured database.
- A modern web browser.

Use the software versions specified in the project configuration whenever available.

## ⚙️ Installation and Configuration

### 1. Clone the Repository

```bash
git clone <GITHUB_REPOSITORY_URL>
cd Web
```

Replace `<GITHUB_REPOSITORY_URL>` with the actual repository URL.

If the repository is already available locally, this step is unnecessary.

### 2. Install Frontend Dependencies

From the project root directory:

```bash
npm install
```

### 3. Configure Frontend Environment Variables

Create a `.env.local` file in the project root using the variable names expected by the frontend code.

Example:

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

This example assumes that the FastAPI backend runs locally on port 8000. Replace the URL with the actual backend URL in the deployment environment.

Never expose MongoDB credentials or backend secrets through `NEXT_PUBLIC_*` variables.

### 4. Install Backend Dependencies

Navigate to the backend directory:

```bash
cd backend
```

If the backend includes a `requirements.txt` file, create a Python virtual environment:

```bash
python -m venv .venv
```

Activate it on Windows PowerShell:

```powershell
.venv\Scripts\Activate.ps1
```

Install the dependencies:

```bash
pip install -r requirements.txt
```

If the project uses `pyproject.toml` or another dependency management method, follow the configuration provided in the repository.

### 5. Configure MongoDB Atlas

Create the backend environment configuration according to the application's actual configuration mechanism.

Example:

```env
MONGODB_URI=<MONGODB_ATLAS_CONNECTION_STRING>
MONGODB_DATABASE=senseforge
```

These variable names are examples. Use the names expected by the backend code.

Ensure that database authentication, network access, and connection settings are configured correctly. Never commit environment files containing credentials to the repository.

## ▶️ Running the Application

Run the frontend and backend in separate terminals.

### Start the FastAPI Backend

From the backend directory, if the application entry point is `main.py` and the FastAPI instance is named `app`:

```bash
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

Adjust the command if the actual entry point or application instance has a different name.

FastAPI documentation is commonly available at:

```text
http://127.0.0.1:8000/docs
```

### Start the Next.js Frontend

From the project root directory:

```bash
npm run dev
```

Open the application at:

```text
http://localhost:3000
```

Ensure that the backend is running before testing frontend features that require API access.

## 🧪 Testing and Evaluation

Testing should cover the implemented functionality and the complete data processing workflow.

### Functional Testing

- Verify that the frontend loads successfully.
- Verify that API endpoints return the expected responses.
- Verify MongoDB connectivity and data retrieval.
- Verify that the Machine Learning pipeline receives the correct input features.
- Verify that anomaly detection results are returned and displayed correctly.
- Verify that analytics aggregations and dashboard visualizations are consistent with the processed data.

### Machine Learning Evaluation

Use metrics appropriate to the model and the availability of ground-truth labels. Depending on the implementation, these may include precision, recall, F1-score, or other suitable evaluation metrics.

Report actual experimental results rather than estimated or assumed values.

### Big Data Performance Evaluation

Experiments may include:

- Processing time across different dataset sizes.
- Database query latency.
- Data processing throughput.
- Resource utilization, if measured.
- Performance comparisons across different configurations.

Record dataset sizes, experimental environments, configurations, and measurement methods to make the results reproducible.

## 🚀 Deployment

The Next.js frontend is intended for deployment on Vercel. The FastAPI backend and MongoDB Atlas database must also be configured for online access.

Before deployment:

1. Confirm that the frontend builds successfully.
2. Confirm that the FastAPI backend starts without errors.
3. Ensure that the Machine Learning model and its required dependencies are available in the deployment environment.
4. Configure environment variables through the hosting platform.
5. Verify database connectivity and network access permissions.
6. Configure the frontend to use the production API URL.
7. Test the complete application workflow after deployment.

The production URL and deployment status should be added after the application has been successfully deployed.

## 🔐 Security

- Never commit `.env`, `.env.local`, database passwords, API tokens, or other credentials.
- Use environment variables for sensitive configuration.
- Restrict MongoDB Atlas access according to the application's requirements.
- Validate incoming API requests.
- Never expose backend secrets in frontend code.
- Ensure that datasets and dependencies have appropriate sources and usage permissions.

## 👥 Development Team — Group 2

SenseForge is developed by **Group 2** as part of the Big Data 2 project. The team consists of five members with responsibilities covering backend development, Machine Learning, Big Data Analytics, frontend development, and final integration and deployment.

| No. | Team Member | Responsibility |
|---|---|---|
| 1 | **Radithya Ahmad Farid** | Backend & Database |
| 2 | **Salman Al Parizi** | Data Processing & Machine Learning |
| 3 | **Chesya Kinanti** | Frontend & Dashboard |
| 4 | **Luthfia Khaira Rizenda** | Big Data Analytics |
| 5 | **Mutia Nur Khalifa** | Final Integration & Deployment |

### Team Responsibilities

- **Radithya Ahmad Farid — Backend & Database:** Designs the MongoDB schema, prepares dataset ingestion, and develops the API.
- **Salman Al Parizi — Data Processing & Machine Learning:** Performs preprocessing, develops the anomaly detection model, and evaluates prediction results.
- **Chesya Kinanti — Frontend & Dashboard:** Develops the SenseForge interface, sensor visualizations, historical records, and anomaly result displays.
- **Luthfia Khaira Rizenda — Big Data Analytics:** Develops aggregation pipelines, tests processing across different dataset sizes, and evaluates system performance.
- **Mutia Nur Khalifa — Final Integration & Deployment:** Integrates the modules, performs end-to-end testing, resolves integration issues, and prepares application deployment.

## 📌 Project Status

**Status:** Active Development

SenseForge integrates Machine Learning and Big Data Analytics to support industrial sensor anomaly detection, data processing, and performance evaluation.

The project focuses on multisensor data analysis, anomaly detection, data visualization, and efficient processing of large datasets.
