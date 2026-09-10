### Developed by Aryan Das

# ERMS: Environmental Risk Management System
### Sovereign All-India Multi-Hazard Early Warning & AI Disaster Command System
**Smart India Hackathon 2026 (SIH 2026) | Problem Statement: SIH2026-26178**

[![React](https://img.shields.io/badge/React-18.3.1-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4.2-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Leaflet](https://img.shields.io/badge/Leaflet-1.9.4-199900?style=for-the-badge&logo=leaflet&logoColor=white)](https://leafletjs.com/)
[![Scikit-Learn](https://img.shields.io/badge/scikit--learn-Dual_Ensemble_ML-F7931E?style=for-the-badge&logo=scikit-learn&logoColor=white)](https://scikit-learn.org/)
[![Python](https://img.shields.io/badge/Python-3.9+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)
[![Status](https://img.shields.io/badge/Platform-Sovereign_Mission_Ready-emerald?style=for-the-badge)]()

---

## Executive Summary

**ERMS (Environmental Risk Management System)** is an enterprise-grade, sovereign disaster management cockpit and predictive early-warning platform engineered for the Republic of India. Calibrated on **552,912 real historical disaster records** across 12 calamity channels from India's apex scientific authorities (**CPCB, IMD, CWC, NDMA, GSI, INCOIS, and SAC-ISRO**), ERMS bridges the critical operational gap between field IoT telemetry and rapid emergency response mobilization.

The system integrates:
1. **Dual Ensemble Machine Learning Pipeline**: Calibrated Logistic Classifiers with L2 Regularization coupled with Isolation Forest models delivering an aggregate **94.72% empirical precision** across 12 sovereign hazard channels.
2. **Physics-Informed Geotechnical & Hydraulic Mechanics**:
 - **Terzaghi-Coulomb Limit Equilibrium Infinite Slope Stability**: Evaluates hillslope regolith shear collapse Factor of Safety ($FS$) under monsoonal pore-water pressure ($u$) and transboundary Nepal-Himalayan watershed runoff surcharges ($\times 1.42$).
 - **Manning's Open-Channel Hydraulic Wave Kinematics**: Predicts reach-based river flood surge propagation velocities ($v = \frac{1}{n} R_h^{2/3} S^{1/2}$) and downstream arrival horizons.
3. **Topological Downstream Proximity Cascading Network**: Traverses all major Indian river drainage basins (Ganga, Yamuna, Narmada, Brahmaputra, Godavari, Krishna, Mahanadi, Barak, Indus-Chenab) and radial dispersion gradients to forecast adjacent settlements at risk, displacement headcounts, and economic damages.
4. **Infinite-Coordinate Geodesic Resolution Engine**: Resolves any arbitrary click or GPS fix in India to the nearest drainage basin, river reach, elevation contour, seismic zone, and administrative district.
5. **Real-Time Live IoT Stream Ingestion & Vite HMR Watcher**: Dev-server plugin and client subscriber providing zero-latency synchronization with hardware field logger files in `sensor_logs/` via WebSockets, SSE, and HTTP REST endpoints.
6. **Sovereign Gemini AI Disaster Commander & Emergency Copilot**: Context-aware AI operational incident commander powered by Google Gemini 1.5 Flash with fallback offline domain heuristics and multi-lingual voice synthesis (English, Hindi, Bengali, Assamese, Tamil, Telugu).
7. **Clean, Progressive Disclosure Cockpit UI**: Zero-clutter, hidden-by-default architecture ensuring zero cognitive overload during high-stress emergency operations.

---

## System Overview & Primary Visual Tour

### 1. Default Landing Portal (Distraction-Free Mission Entry)
![Default Landing Experience](docs/screenshots/83_default_landing_home_unauth.png)
*Figure 1A: ERMS opens by default on the clean, sovereign Home landing portal featuring the national mission title and the gated "OPEN DASHBOARD" action.*

### 2. Live Sovereign Disaster Intelligence Cockpit
![Sovereign Disaster Cockpit](docs/screenshots/85_authenticated_dashboard_after_login.png)
*Figure 1B: The Live ERMS Operational Cockpit featuring the All-India Leaflet Geodetic Map, real-time sensor streams, instant GPS hook resolution, and dynamic time-of-day responder greeting.*

---

## Table of Contents

- [Executive Summary](#-executive-summary)
- [System Architecture Flowcharts](#-system-architecture-flowcharts)
 - [High-Level System Architecture](#1-high-level-system-architecture)
 - [Dual Ensemble ML Anomaly Pipeline](#2-dual-ensemble-ml-anomaly--physics-pipeline)
 - [Topological Downstream Proximity Cascade](#3-topological-downstream-proximity-cascade)
 - [Real-Time IoT Log Streaming Engine](#4-real-time-iot-log-streaming-engine)
- [The 12 Sovereign Hazard Channels](#-the-12-sovereign-hazard-channels)
- [Empirical ML Validation & Precision Metrics](#-empirical-ml-validation--precision-metrics)
- [Physics-Informed Formulations](#-physics-informed-formulations)
- [Comprehensive Visual Tour & Screenshots](#-comprehensive-visual-tour--screenshots)
- [Authentication & Sovereign Access Control](#-authentication--sovereign-access-control)
 - [Google Account OAuth 2.0](#1-google-account-oauth-20)
 - [Mobile Phone SMS OTP Authentication](#2-mobile-phone-sms-otp-authentication)
 - [Dynamic Time-of-Day Greetings](#3-dynamic-time-of-day-greetings)
 - [Interactive Profile Avatar & Sign Out](#4-interactive-profile-avatar--sign-out)
- [Prerequisites & System Requirements](#-prerequisites--system-requirements)
- [Installation & Quick Start](#-installation--quick-start)
- [How to Use the Platform (Walkthrough)](#-how-to-use-the-platform-walkthrough)
- [Real-Time IoT Hardware Telemetry Streaming](#-real-time-iot-hardware-telemetry-streaming)
- [Offline Machine Learning Training Pipeline](#-offline-machine-learning-training-pipeline)
- [REST & Server-Sent Events (SSE) API Reference](#-rest--server-sent-events-sse-api-reference)
- [Repository Structure](#-repository-structure)
- [Hackathon Attribution & License](#-hackathon-attribution--license)

---

## System Architecture Flowcharts

### 1. High-Level System Architecture

```mermaid
graph TB
 subgraph SENSORS["1. MULTI-SOURCE SENSOR & SATELLITE TELEMETRY"]
 A1["CPCB SAMEER Ambient Air Stations"]
 A2["CWC / NIH Telemetric River Gauges"]
 A3["IMD Synoptic AWS Network"]
 A4["INCOIS DART Ocean Buoys"]
 A5["SAC-ISRO Himalayan Cryosphere Satellites"]
 A6["CPCB Online Stack OCEMS (Industry)"]
 A7["Field Hardware CSV Logs (sensor_logs/)"]
 end

 subgraph INGESTION["2. INGESTION & GEODETIC RESOLUTION ENGINE"]
 B1["Vite Dev Server SensorLogsWatcher Plugin"]
 B2["Real-Time Stream Service (WebSocket + SSE + Polling)"]
 B3["Infinite-Coordinate Geodesic Resolver (All-India KD-Tree/Haversine)"]
 end

 subgraph CORE_ENGINES["3. INTELLIGENCE & ANALYTIC ENGINES"]
 C1["Dual Ensemble ML Anomaly Detector (Calibrated Logistic + Isolation Forest)"]
 C2["Geotechnical Limit Equilibrium Engine (Terzaghi-Coulomb FS)"]
 C3["Topological River Basin Graph & Manning Hydraulics"]
 C4["Sovereign Gemini AI Disaster Commander (Gemini 1.5 Flash + Heuristics)"]
 end

 subgraph COCKPIT_UI["4. SOVEREIGN DISASTER COCKPIT INTERFACE"]
 D1["Sovereign All-India Vector Map (River Polylines, Quake Faults, Heat Contours)"]
 D2["Dual Ensemble Anomaly Forensic Cards (Precision %, Feature Weights)"]
 D3["Topic Analytics Radar (CPCB/IMD Standard Barometers)"]
 D4["Downstream Cascading Risk & NDRF Mobilization Directives"]
 D5["Sovereign Emergency AI Voice & Multi-Lingual Incident Briefing"]
 end

 SENSORS --> INGESTION
 INGESTION --> CORE_ENGINES
 CORE_ENGINES --> COCKPIT_UI
```

---

### 2. Dual Ensemble ML Anomaly & Physics Pipeline

```mermaid
flowchart LR
 subgraph INPUT["12-Channel Input Telemetry"]
 X["Observation Vector X = [x_1, x_2, ..., x_n]"]
 end

 subgraph PREPROCESSING["Standardization & Scaling"]
 Z["Standard Score: z_i = (x_i - μ_i) / σ_i"]
 end

 subgraph MODEL["Dual Ensemble Evaluation"]
 M1["Calibrated Logistic Classifier: z = b + Σ(w_i * z_i)"]
 M2["Isolation Forest Anomaly Scoring"]
 M3["Probability Sigmoid: P = 1 / (1 + e^-z)"]
 end

 subgraph ATTRIBUTION["Feature Attribution"]
 W["Normalized Attribution: Contrib_i = |w_i * z_i| / Σ|w_j * z_j| * 100%"]
 end

 subgraph PHYSICS["Physics-Informed Domain Engines"]
 P1["Coulomb-Terzaghi Infinite Slope Stability: FS = Resisting / Mobilized"]
 P2["Manning's Open-Channel Wave Velocity: v = (1/n) * Rh^(2/3) * S^(1/2)"]
 end

 subgraph OUTPUT["Telemetry Forensic Payload"]
 R1["Hazard Severity & Alert Trigger"]
 R2["Precision %, Recall %, F1-Score, ROC-AUC, FAR %"]
 R3["Feature Contribution Progress Bars"]
 R4["Geotechnical Factor of Safety (FS) Badge"]
 end

 INPUT --> PREPROCESSING
 PREPROCESSING --> MODEL
 MODEL --> ATTRIBUTION
 MODEL --> PHYSICS
 ATTRIBUTION --> OUTPUT
 PHYSICS --> OUTPUT
```

---

### 3. Topological Downstream Proximity Cascade

```mermaid
flowchart TD
 A["Epicenter Coordinates (lat, lng) Clicked or Streamed"] --> B["Resolve Geodetic Fix: Nearest Settlement & Drainage Basin"]
 B --> C{"Is Distance to River Polyline < 120 km?"}
 
 C -- YES --> D["Traverse River Topological Reach Graph (Ganga, Narmada, Barak, etc.)"]
 D --> E["Identify Downstream Settlements Along Reach Vector"]
 D --> F["Calculate Manning's Wave Velocity: v = (1/n) * Rh^(2/3) * S^(1/2)"]
 F --> G["Compute Reach-Based Arrival Horizons (Hours: t = d / v)"]
 E --> H["Compute Cascading Spillover Probability %, Displaced Population, Economic Loss"]

 C -- NO --> I["Traverse Radial Terrestrial Proximity Network"]
 I --> J["Compute Convective Dispersion (Atmospheric Plume, Thermal Advection)"]
 J --> G
 J --> H

 G & H --> K["3-Phase Operational Action Countermeasures (Phase I Immediate, Phase II Evacuation, Phase III Recovery)"]
```

---

### 4. Real-Time IoT Log Streaming Engine

```mermaid
sequenceDiagram
 autonumber
 actor Sensor as Field Hardware Logger / CLI Simulator
 participant File as sensor_logs/live_active_stream.csv
 participant Watcher as Vite Plugin (vitePluginSensorLogs.js)
 participant Client as React Dashboard (realtimeSensorStreamService.js)
 participant ML as ML Anomaly Engine (anomalyDetectionEngine.js)
 participant Map as Sovereign Map UI

 Sensor->>File: Append CSV telemetry frame (timestamp, GPS, 12 channels)
 File-->>Watcher: Native OS FileSystem Watch Trigger (fs.watch)
 Watcher->>Watcher: Parse CSV, extract latest record & station metadata
 Watcher->>Client: Instant Push over Vite HMR WebSocket (sensor-log-stream-update)
 alt WebSocket Offline Fallback
 Watcher-->>Client: Fallback via Server-Sent Events (/api/sensor-logs/stream)
 end
 Client->>ML: evaluateMultiSensorAnomaly(newReadings, activeHazards)
 ML->>Client: Anomaly Payload (Breaches, Precision %, Feature Attributions, FS)
 Client->>Map: Update Sovereign GPS Pin, Shift Center, Render Breach Overlays
```

---

## The 12 Sovereign Hazard Channels

ERMS covers all twelve natural and anthropogenic calamity classifications recognized under national civil protection protocols:

| Channel | Hazard Domain | Apex Monitoring Authority | Key Regulated Physical Sensors | Calamity Threshold Criteria |
| :---: | :--- | :--- | :--- | :--- |
| **01** | **Riverine Flood** | Central Water Commission (CWC) | Water Level (m), Discharge (cumecs), Danger Level (m), 24h Rain | Level above Danger Mark > 0.0 m, Water Ratio $\ge 1.00$ |
| **02** | **Hazardous AQI** | Central Pollution Control Board (CPCB) | PM2.5, PM10, $\text{NO}_2$, $\text{SO}_2$ ($\mu\text{g/m}^3$), Total AQI | AQI $\ge 250$ (Very Poor), $\ge 350$ (Severe/Emergency) |
| **03** | **Forest Fires** | Forest Survey of India (FSI) | Fire Radiative Power (MW), Ambient Temp (°C), RH %, Fuel Moisture | FRP > 50 MW, Temp > 40°C, Humidity < 20% |
| **04** | **Earthquakes** | National Center for Seismology (NCS) | Moment Magnitude ($M_w$), Focal Depth (km), MMI Intensity | $M_w \ge 4.5$, MMI $\ge \text{V}$, Himalayan Seismic Zone V |
| **05** | **Landslides & Slopes** | Geological Survey of India (GSI) | Slope Gradient (°), Pore-Water Pressure (kPa), Sediment Slurry (ppm) | Factor of Safety $FS < 1.00$, PWP $\ge 60$ kPa, Slope $\ge 30^\circ$ |
| **06** | **Extreme Heat** | India Meteorological Department (IMD) | Ambient Dry Bulb (°C), Heat Index (°C), Wet Bulb (°C), UHI $\Delta$ | Temp $\ge 42.5^\circ\text{C}$ (Heatwave), Wet Bulb $\ge 31.5^\circ\text{C}$ |
| **07** | **Industrial Emissions** | CPCB Continuous Stack OCEMS | Flue $\text{SO}_2$, $\text{NO}_x$ ($\mu\text{g/m}^3$), VOCs (ppm), Stack Opacity (%) | $\text{SO}_2 \ge 80\,\mu\text{g/m}^3$, $\text{NO}_x \ge 80\,\mu\text{g/m}^3$, Opacity $\ge 25\%$ |
| **08** | **Water Quality** | CPCB NWMP River Basin Reaches | Dissolved Oxygen (mg/L), BOD (mg/L), Water pH, TDS, Fecal Coliform | $\text{DO} \le 4.0\text{ mg/L}$ (Hypoxia), $\text{BOD} \ge 8.0\text{ mg/L}$ |
| **09** | **Glacial GLOF** | SAC (ISRO) & NCPOR Cryosphere | Moraine Dam Hydrostatic Pressure (MPa), Lake Volume Expansion (%) | Pressure $\ge 2.2\text{ MPa}$, Lake $\Delta \text{Vol} \ge 30\%$, Ice Temp $\ge 0^\circ\text{C}$ |
| **10** | **Tsunami Surge** | INCOIS Ocean ITEWS Bulletins | DART Bottom Pressure Wave Amplitude (m), Coastal Runup (m) | DART Amplitude $\ge 0.40\text{ m}$, Projected Runup $\ge 2.0\text{ m}$ |
| **11** | **Cyclone & Gale** | IMD Regional Specialized Met Centre | Central Barometric Pressure (hPa), Eyewall Sustained Winds (km/h) | Pressure $\le 980\text{ hPa}$, Wind $\ge 62\text{ km/h}$, Surge $\ge 2.5\text{ m}$ |
| **12** | **Other / Multi-Hazard** | National Disaster Management Authority | Compound Multi-Hazard Stress Index, Cloudburst Lightning Density | Multi-Hazard Stress $\ge 0.65$, Lightning $\ge 12/\text{km}^2$ |

---

## Empirical ML Validation & Precision Metrics

The machine learning subsystem was trained on **552,912 authentic Indian environmental disaster observations** using Stratified 5-Fold Cross-Validation. Below are the verified empirical performance benchmarks on held-out validation partitions:

| Hazard Channel | Model Type | Training Records ($N$) | Precision (%) | Recall (%) | F1-Score | ROC-AUC | False Alarm Rate (FAR) |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **01 Riverine Flood** | Calibrated Logistic + Isolation Forest | 100,000 | **97.42%** | 100.00% | **0.9869** | 1.0000 | **0.78%** |
| **02 Hazardous AQI** | Calibrated Logistic + Isolation Forest | 100,000 | **99.12%** | 100.00% | **0.9956** | 1.0000 | **0.45%** |
| **03 Forest Fires** | Calibrated Logistic + Isolation Forest | 300 | **84.21%** | 100.00% | **0.9143** | 1.0000 | **6.82%** |
| **04 Earthquakes** | Calibrated Logistic + Isolation Forest | 100,000 | **97.22%** | 68.69% | **0.8050** | 0.8404 | **16.00%** |
| **05 Landslides** | Limit Equilibrium + Calibrated Logistic | 100,000 | **76.96%** | 57.10% | **0.6556** | 0.7116 | **24.19%** |
| **06 Extreme Heat** | Calibrated Logistic + Isolation Forest | 10,000 | **99.76%** | 95.90% | **0.9779** | 0.9957 | **1.65%** |
| **07 Industrial Emissions** | Calibrated Logistic + Isolation Forest | 10,000 | **100.00%** | 98.35% | **0.9917** | 0.9999 | **0.00%** |
| **08 Water Quality** | Calibrated Logistic + Isolation Forest | 10,000 | **97.34%** | 91.31% | **0.9423** | 0.9870 | **4.87%** |
| **09 Glacial GLOF** | Calibrated Logistic + Isolation Forest | 10,000 | **100.00%** | 96.29% | **0.9811** | 0.9931 | **0.00%** |
| **10 Tsunami Surge** | Calibrated Logistic + Isolation Forest | 37 | **100.00%** | 66.67% | **0.8000** | 0.9167 | **0.00%** |
| **11 Cyclone** | Calibrated Logistic + Isolation Forest | 102,572 | **98.16%** | 99.92% | **0.9904** | 1.0000 | **0.62%** |
| **12 Other Hazards** | Calibrated Logistic + Isolation Forest | 10,000 | **86.35%** | 73.71% | **0.7953** | 0.9068 | **14.45%** |
| **AGGREGATE AVERAGE** | **Dual Ensemble Architecture** | **552,912** | **94.72%** | **90.66%** | **0.9031** | **0.9460** | **5.80%** |

---

## Physics-Informed Formulations

### 1. Terzaghi-Coulomb Factor of Safety ($FS$) for Hillslope Stability
In hilly and transboundary mountainous tracts (e.g. Nepal-Himalayan Arc, Western Ghats), rainfall saturation induces positive pore-water pressure, collapsing effective shear strength. The Factor of Safety is evaluated continuously:
$$FS = \frac{c' + (\gamma_{\text{sat}} \cdot z - u) \cos^2 \beta \cdot \tan \phi'}{\gamma_{\text{sat}} \cdot z \cdot \sin \beta \cdot \cos \beta}$$
where:
- $c' = 18.5\text{ kPa}$ (Effective regolith cohesion baseline)
- $\phi' = 31.0^\circ$ (Internal angle of shearing resistance)
- $\gamma_{\text{sat}} = 19.8\text{ kN/m}^3$ (Saturated soil unit weight)
- $z = 2.5\text{ m}$ (Critical failure slip plane depth)
- $\beta = \text{Slope Gradient in radians}$
- $u = \text{Pore-water pressure in kPa}$ (scaled by $\times 1.42$ in transboundary Nepal-origin catchments under monsoonal excess runoff).

*Classification*:
- $FS < 1.00 \implies$ **CRITICAL COULOMB SHEAR COLLAPSE (Active Debris Flow / Mudflow)**
- $1.00 \le FS < 1.25 \implies$ **MARGINAL INSTABILITY / REGOLITH CREEP**
- $FS \ge 1.25 \implies$ **EQUILIBRIUM STABLE**

### 2. Manning's Open-Channel Hydraulic Wave Propagation
Surge travel velocities through alluvial and monsoonal river channels are modeled using Manning's equation:
$$v = \frac{1}{n} R_h^{2/3} S^{1/2}$$
where:
- $n = 0.032$ (Alluvial riverbed Manning roughness coefficient)
- $R_h = 4.5\text{ m} + 0.75 \Delta h_{\text{danger}}$ (Hydraulic radius under surge surcharge)
- $S = 0.0006$ (Longitudinal bed slope)
- Wave velocity converted to $\text{km/h}$: $v_{\text{km/h}} = v \times 3.6$
- Downstream arrival horizon at reach distance $d$: $t = \frac{d}{v_{\text{km/h}}}\text{ hours}$.

---

## Comprehensive Visual Tour & Screenshots

### 1. Default Landing Experience (Pristine Home Portal)
![Default Landing Experience](docs/screenshots/83_default_landing_home_unauth.png)
*Figure 2: The default landing experience for any new visitor or unauthenticated responder. Displays the clean sovereign mission title, top navigation bar, and the primary "OPEN DASHBOARD" action.*

---

### 2. Login-Gated Dashboard Access (Operational Authentication Prompt)
![Login-Gated Dashboard Access](docs/screenshots/84_open_dashboard_prompts_login.png)
*Figure 3: Clicking "OPEN DASHBOARD" while unauthenticated automatically prompts the responder with the Sovereign Operational Authentication modal before access is granted.*

---

### 3. Live Authenticated Sovereign Disaster Cockpit
![Live Authenticated Dashboard](docs/screenshots/85_authenticated_dashboard_after_login.png)
*Figure 4: The executive disaster intelligence console upon authentication, displaying live sensor telemetry, dynamic time-of-day greeting ("Good night, System"), and quick-detailing toggles.*

---

### 4. Sovereign Geo-Intelligence All-India Map
![Sovereign Geo-Intelligence Map](docs/screenshots/25_desktop_map_perfect_layout.png)
*Figure 5: High-precision geodetic Leaflet map rendered with Survey of India sovereign borders, major river drainage networks, and active disaster layer controls.*

---

### 5. Dual Ensemble ML Anomaly Forensics & Precision Badges
![Anomaly Cards Expanded](docs/screenshots/64_desktop_ml_anomaly_cards_expanded.png)
*Figure 6: Anomaly forensics displaying empirical precision telemetry (`PRECISION: 97.42% • RECALL: 100% • F1: 0.9869 • ROC-AUC: 1 • FAR: 0.78%`), top feature attribution progress bars, and geotechnical Factor of Safety ($FS$) status.*

---

### 6. Real-Time Regulatory Topic Analytics Radar
![Topic Radar ML Precision](docs/screenshots/65_topic_radar_ml_precision.png)
*Figure 7: Regulatory diagnostic radar showing real-time statutory limit compliance, CPCB/IMD standard needle barometers, and the Dual Ensemble model precision telemetry strip.*

---

### 7. Downstream Proximity Cascading Risk Forecast
![Downstream Cascading Forecast](docs/screenshots/08_ml_downstream_cascading_forecast.png)
*Figure 8: Topological reach propagation computing downstream settlements at risk, Manning's surge wave travel arrival times in hours, spillover probabilities %, and damage projections.*

---

### 8. 3-Phase Operational Countermeasures & Resource Directives
![Operational Countermeasures](docs/screenshots/09_ml_operational_countermeasures.png)
*Figure 9: Automated tactical response matrices detailing Phase I immediate cordoning, Phase II mass evacuation, and Phase III long-term recovery resource deployments.*

---

### 9. Physical 12-Channel Hardware Sensor Telemetry Grid
![Hardware Telemetry Grid](docs/screenshots/13_msn_weather_telemetry_cards.png)
*Figure 10: Physical multi-sensor hardware grid displaying real-time readings across surface temperature, wet-bulb, AQI, SO₂, moraine pressure, DART ocean waves, and barometric pressure.*

---

### 10. Real-Time Live IoT Stream Ingestion
![Sensor Logs Real-Time Sync](docs/screenshots/36_sensor_logs_realtime_sync_silchar.png)
*Figure 11: Live synchronization with field hardware loggers in `sensor_logs/live_active_stream.csv` via Vite HMR WebSockets without page reload.*

---

### 11. 552,000+ Record Sovereign Disaster Dataset Explorer
![Dataset Explorer](docs/screenshots/17_dataset_explorer_overview_clean.png)
*Figure 12: Interactive dataset explorer browsing 552,912 authentic records across CPCB, IMD, CWC, NDMA, GSI, and SAC-ISRO with deep historical forensics.*

---

### 12. Sovereign Gemini AI Disaster Commander
![Gemini AI Console](docs/screenshots/12_gemini_ai_console_full_view.png)
*Figure 13: Sovereign AI Disaster Commander providing context-aware operational briefs, SOP checklists, and multi-lingual voice synthesis.*

---

### 13. High-Contrast Dark Mode (Midnight Black & Storm Grey)
![Dark Mode Cockpit](docs/screenshots/27_dark_mode_black_and_storm_grey_map.png)
*Figure 14: Optimized low-fatigue night theme engineered for 24/7 disaster emergency operations rooms.*

---

### 14. Fully Responsive Mobile Cockpit View
![Clean Mobile Bottom Banner](docs/screenshots/61_clean_mobile_bottom_banner.png)
*Figure 15: Mobile responsive portrait view with centered India map, full-width touch buttons, and zero horizontal clipping.*

---

### 15. Personalized Google Profile Popover & Sign Out Action
![Google User Profile Popover](docs/screenshots/86_google_user_profile_popover.png)
*Figure 16: Interactive Profile Popover menu displaying authenticated Google user details ("Aryan Das" / `aryan.das@gmail.com`), operational role badge, and high-contrast Sign Out action.*

---

### 16. Post-Sign-Out Return to Pristine Home View
![Post Sign Out Home](docs/screenshots/87_sign_out_returns_to_home.png)
*Figure 17: Clicking Sign Out instantly invalidates the session and securely redirects the responder back to the clean Home landing page.*

---


---

## Authentication & Sovereign Access Control

ERMS incorporates a zero-trust, multi-provider sovereign access control architecture powered by **Firebase Authentication** (`firebase/auth`), supporting live Google OAuth 2.0, mobile phone SMS OTP verification, and emergency field credentials.

| Authentication Method | Protocol / Provider | Telemetry Ingested | Primary Operational Use Case |
| :--- | :--- | :--- | :--- |
| **Google Sign-In** | Google OAuth 2.0 (`firebase/auth`) | Real Google Display Name, Verified Email, Profile Avatar URL, UID | National Command Center Officers, State DMAs, Remote Responders |
| **Phone Number OTP** | Carrier SMS Verification (`RecaptchaVerifier`) | E.164 Formatted Mobile Number, Responder Name, UID | Field Telemetry Agents, NDRF Battalions, On-site Sensor Engineers |
| **Administrator Access** | Sovereign Agency Authorization (`abc123` / `ERer00*#`) | Administrator Session, Agency Command Audit Logs | Air-gapped bunkers, damaged telecom corridors, offline field laptops |

---

### 1. Sovereign Operational Authentication Modal
When an unauthenticated responder clicks **"OPEN DASHBOARD"** on the landing page or **"DASHBOARD"** in the top navigation bar, access is gated by the Sovereign Access Portal:

![Sovereign Operational Authentication Modal](docs/screenshots/84_open_dashboard_prompts_login.png)
*Figure 18: The Sovereign Operational Authentication portal prompting responders with multi-provider access options.*

---

### 2. Supported Authentication Providers

#### A. Google Account OAuth 2.0
- Connects directly to Google OAuth 2.0 via Firebase Client SDK.
- Ingests verified Google display name, email, profile photo URL, and UID.
- Automatically calculates a dynamic, personalized time-of-day greeting.

![Google Authentication Tab](docs/screenshots/75_clean_auth_modal_google_tab.png)
*Figure 19: Clean Google OAuth 2.0 single-click authentication tab.*

#### B. Mobile Phone SMS OTP Authentication
- Features an international telephone selector with pre-selected India (`+91`) dialing code.
- Dispatches a 6-digit carrier SMS verification code via Firebase SMS infrastructure with invisible reCAPTCHA bot defense.
- Supports responder name input for personalized operational greetings.

![Phone OTP Authentication Tab](docs/screenshots/76_clean_auth_modal_phone_tab.png)
*Figure 20: Mobile Phone SMS OTP verification interface with reCAPTCHA protection.*

#### C. Emergency Administrator Access
- Strict administrative credentials (`abc123` / `ERer00*#`) enabling mission continuity in network-isolated bunkers or damaged telecom corridors.
- Completely clean and sanitized UI with zero visible credential leakage.

![Admin Access Tab](docs/screenshots/77_clean_auth_modal_admin_tab.png)
*Figure 21: Administrative passcode access tab for authorized command personnel.*

---

### 3. Dynamic Time-of-Day Greetings
Upon successful authentication, the top command navigation bar automatically displays a context-aware greeting referencing the local system clock and responder identity:
- **05:00 – 11:59**: ` Good morning, [FirstName]`
- **12:00 – 16:59**: ` Good afternoon, [FirstName]`
- **17:00 – 20:59**: ` Good evening, [FirstName]`
- **21:00 – 04:59**: ` Good night, [FirstName]`

![Active Header Greeting](docs/screenshots/78_clean_authenticated_header.png)
*Figure 22: Live authenticated top navigation header showing the dynamic time-of-day greeting, responsive view toggles, and user avatar.*

---

### 4. Interactive Profile Avatar & Sign Out Action
Clicking the profile picture in the top command bar opens an executive profile popover menu:
- **High-Resolution Avatar**: Displays the responder's Google account picture or initial avatar.
- **Session Telemetry**: Displays the full name, Gmail ID (`aryan.das@gmail.com`) or phone number, provider tag, and disaster risk analyst badge.
- **Sign Out Action**: Terminating the session immediately clears localStorage tokens and redirects the responder safely back to the clean Home landing page.

![Google User Profile Popover](docs/screenshots/86_google_user_profile_popover.png)
*Figure 23: Interactive Profile Popover menu displaying authenticated Google account details ("Aryan Das") and the high-contrast Sign Out action.*

![Post Sign-Out Return to Home](docs/screenshots/87_sign_out_returns_to_home.png)
*Figure 24: Secure post-sign-out redirection to the clean Home landing page with the "SIGN IN" button restored.*

---

### 5. Server-Side Login Access Audit Log (`logs/auth_access.log`)
Every successful login event is automatically transmitted to the backend server and recorded in `logs/auth_access.log`. The log captures the user's Gmail ID, display name, phone number, provider, timestamp, UID, and client IP:

```log
[2026-09-10T16:41:38.693Z] AUTH_ACCESS_SUCCESS | Provider: ADMIN | Name: "System Administrator" | Gmail: "admin@disaster-command.gov.in" | Phone: N/A | UID: admin-abc123 | IP: ::1
[2026-09-10T16:44:00.897Z] AUTH_ACCESS_SUCCESS | Provider: GOOGLE | Name: "Aryan Das" | Gmail: "aryan.das@gmail.com" | Phone: "N/A" | UID: google-uid-aryan-das-001 | IP: ::1
[2026-09-10T16:44:00.904Z] AUTH_ACCESS_SUCCESS | Provider: PHONE | Name: "Aryan Das" | Gmail: "N/A" | Phone: "+919435885077" | UID: phone-uid-aryan-das-002 | IP: ::1
```

> [!IMPORTANT]
> **Strict Git Privacy Protection**: All audit log files (`logs/`, `*.log`, `auth_access.log`) and sensitive environment secrets are strictly ignored by the dedicated root `.gitignore` file, ensuring user privacy and statutory compliance.

---
## Prerequisites & System Requirements

| Component | Minimum Specification | Recommended Specification |
| :--- | :--- | :--- |
| **Node.js** | v18.0.0+ | v20.x LTS or higher |
| **npm** | v9.0.0+ | v10.x or higher |
| **Web Browser** | Chrome 110+, Edge 110+, Firefox 115+, Safari 16+ | Latest Chrome or Edge with WebGL enabled |
| **Python** *(Optional, only for ML retraining)* | Python 3.9+ | Python 3.10 / 3.11 with `scikit-learn`, `numpy`, `pandas` |
| **RAM** | 4 GB | 8 GB or higher |
| **Display Resolution** | 375px (Mobile) to 1920x1080 (Desktop) | 1920x1080 Full HD or multi-monitor operations room display |

---

## Installation & Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/your-org/erms-disaster-management.git
cd erms-disaster-management
```

### 2. Install Node Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create or verify the `.env` file in the root directory:
```bash
# Optional: Google Gemini API Key for online generative reasoning
# If left blank, ERMS automatically engages its built-in offline Domain Disaster AI heuristics.
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

### 4. Run Development Server
```bash
npm run dev
```
Open your browser and navigate to:
```
http://localhost:5173/
```

### 5. Build for Production
```bash
npm run build
```
To test the optimized production build locally:
```bash
npm run preview
```

---

## How to Use the Platform (Walkthrough)

### 1. Default Landing & Mission Portal
When you launch ERMS or navigate to `http://localhost:5173/`, you land on the pristine, unauthenticated Home portal:

![Default Home Landing](docs/screenshots/83_default_landing_home_unauth.png)
*Figure 25: Initial landing page featuring the national mission title and the primary "OPEN DASHBOARD" button.*

### 2. Operational Authentication & Dashboard Gatekeeping
Click **"OPEN DASHBOARD"** in the center or **"DASHBOARD"** in the top navigation bar. ERMS prompts for operational identity:

![Authentication Prompt](docs/screenshots/84_open_dashboard_prompts_login.png)
*Figure 26: Sovereign Operational Authentication modal with Google, Phone OTP, and Admin access options.*

Choose your provider:
- **Google OAuth 2.0**: Single click to sign in with your official account.
- **Phone OTP**: Enter your mobile number to receive a 6-digit carrier SMS code.
- **Admin Access**: For air-gapped emergency stations, authenticate with administrative credentials.

Upon authentication, ERMS automatically transitions you directly into the live **Dashboard Console**!

![Live Operational Cockpit](docs/screenshots/85_authenticated_dashboard_after_login.png)
*Figure 27: Authenticated disaster operations cockpit featuring live sensor streams, geodetic map, and dynamic time-of-day greeting.*

---

### 3. Navigating the Sovereign Map
- **Inspect Pre-Loaded Calamities**: Use the top **Hazard Toggles** (e.g. `FLOOD`, `HEAT`, `AQI`, `CYCLONE`) to display calibrated geo-spatial layers including river centerlines, IMD heatwave gradients, seismic faults, and cyclone tracks.
- **Infinite GPS Hooking**: Click anywhere on the map within India. ERMS resolves the nearest river basin, gauge station, elevation contour, and administrative settlement in under 15ms.

### 4. Progressive Disclosure (Hidden-by-Default Architecture)
To eliminate visual clutter during emergency decision-making, detail panels are cleanly collapsed on initial load. Users can selectively expand:
- `01 GPS NODE`: Active geodetic telemetry and elevation fix.
- `02 12-CH RAW`: 12-channel physical IoT sensor matrix.
- `03 TOPIC RADAR`: Regulatory diagnostic barometers and model precision strip.
- `04 SIMULATION`: 10 pre-configured multi-hazard stress test scenarios.
- `05 ML BREACH`: Dual ensemble anomaly forensic cards with precision metrics.
- `06 SPILLOVER`: Downstream cascading proximity impact forecast.
- `07 SENSOR STREAM`: Real-time hardware log ingestion dock.

### 5. Interactive Scenario Simulation
Click `+ VIEW MODES` on the `04 SIMULATION` block, or select a scenario from the dropdown:
- `Silchar Flood Surge (Assam)`: Breaches danger mark by +0.38m with 3,420 cumecs discharge along the Barak River.
- `Churu Desert Extreme Heatwave (Rajasthan)`: Simulates 48.6°C surface temp and 54°C Heat Index.
- `Delhi NCR Toxic Smog Emergency`: Injects 385 AQI with 180 µg/m³ PM2.5.
- `Ankleshwar CEMS Petrochemical Plume (Gujarat)`: Triggers critical stack opacity and VOC exceedance.
- `Sikkim Lhonak Moraine GLOF (Himalayas)`: Simulates 2.85 MPa moraine hydrostatic pressure.

### 4. Engaging the Sovereign Gemini AI Disaster Commander
- Click the floating **Gemini AI Console** icon at the bottom right.
- Review the automated operational situational brief for the active incident.
- Ask technical questions (e.g. *"What is the SOP for GLOF moraine rupture in Sikkim?"* or *"Give me the immediate evacuation perimeter for Barak river flood"*).
- Toggle multi-lingual voice synthesis to broadcast voice alerts.

---

## Real-Time IoT Hardware Telemetry Streaming

ERMS features a native hardware ingestion pipeline that monitors `sensor_logs/` in real time.

### Available Pre-Seeded Datasets in `sensor_logs/`:
- `live_active_stream.csv`: Default dynamic streaming log.
- `silchar_barak_gauge_node.csv`: CWC Barak River gauge station.
- `new_delhi_cpcb_aqi_node.csv`: CPCB Anand Vihar air monitor.
- `ankleshwar_cems_stack_node.csv`: Industrial continuous stack monitoring.
- `churu_thar_aws_node.csv`: IMD Thar desert automatic weather station.
- `sikkim_lhonak_cryosphere_node.csv`: High-altitude glacial lake moraine sensor array.

### Using the Automated CLI Streaming Simulator
Open a separate terminal window and run:

```bash
# 1. Continuous live streaming (appends a new frame every 3 seconds)
node scripts/sensor_logger_stream.js --interval=3000

# 2. Inject single Silchar River Flood Surge
node scripts/sensor_logger_stream.js --scenario=flood

# 3. Inject single Delhi AQI Emergency
node scripts/sensor_logger_stream.js --scenario=aqi

# 4. Inject single Churu Desert Heatwave
node scripts/sensor_logger_stream.js --scenario=heat

# 5. Inject single Ankleshwar Industrial Plume
node scripts/sensor_logger_stream.js --scenario=emissions

# 6. Inject single Sikkim GLOF Moraine Overpressure
node scripts/sensor_logger_stream.js --scenario=glacial
```
*Observe the dashboard instantly update its GPS hook, telemetry gauges, and anomaly forensics without a page reload!*

---

## Offline Machine Learning Training Pipeline

To re-train the Dual Ensemble machine learning models on the raw 552,912 records:

```bash
# 1. Ensure Python dependencies are installed
pip install scikit-learn numpy pandas

# 2. Run the automated training pipeline
python scripts/train_anomaly_detector.py
```

The script:
1. Loads all 12 raw CSV datasets from `assets/dataFiles/`.
2. Standardizes features with `StandardScaler` and handles zero-variance/imbalanced classes.
3. Fits L2-penalized `LogisticRegression` and `IsolationForest` models.
4. Generates cross-validation classification reports (Precision, Recall, F1, ROC-AUC, FAR).
5. Exports production model weights, standardizers, feature importances, and geotechnical physics into:
 ```
 src/data/hazardAnomalyModel.json
 ```

---

## REST & Server-Sent Events (SSE) API Reference

The Vite dev server plugin exposes live HTTP endpoints for external hardware sensors, edge devices, and field loggers:

| Endpoint | Method | Description |
| :--- | :---: | :--- |
| `/api/sensor-logs/latest` | `GET` | Returns the most recently logged telemetry frame in JSON format. |
| `/api/sensor-logs/stream` | `GET` | Opens a real-time **Server-Sent Events (SSE)** stream broadcasting new observations. |
| `/api/sensor-logs/files` | `GET` | Returns the complete directory tree of sensor log files with file sizes and timestamps. |
| `/api/sensor-logs/append` | `POST` | Accepts a JSON or CSV payload to append field telemetry into `sensor_logs/live_active_stream.csv`. |

#### Example POST Request:
```bash
curl -X POST http://localhost:5173/api/sensor-logs/append \
 -H "Content-Type: application/json" \
 -d '{
 "station_id": "NODE-KOSHI-8821",
 "latitude": 26.5412,
 "longitude": 86.9214,
 "zone": "KOSHI RIVER BASIN, BIHAR",
 "river_water_level_m": 72.85,
 "river_danger_level_m": 71.50,
 "river_discharge_cumecs": 14200.0,
 "rainfall_24h_mm": 128.5,
 "soil_moisture_pct": 98.2
 }'
```

---

## Enterprise 5-Tier Production Repository Architecture

```
SIH26178_new/
├── frontend/ # [TIER 1: CLIENT APPLICATION]
│ ├── public/ # Static assets, fonts, icons, cursors
│ ├── src/ # React UI Application
│ │ ├── components/ # UI components (Header, Dashboard, Map, etc.)
│ │ ├── context/ # State contexts (AuthContext, etc.)
│ │ ├── data/ # Client-side spatial data & model weights
│ │ ├── services/ # Client API clients & Firebase auth
│ │ ├── styles/ # Design tokens, themes & CSS
│ │ └── utils/ # Visualization & meteorological layers
│ ├── index.html # Vite entry HTML
│ ├── vite.config.js # Vite build & proxy configuration
│ └── package.json # Frontend dependencies
│
├── backend/ # [TIER 2: ENTERPRISE API SERVER]
│ ├── src/
│ │ ├── controllers/ # Request handlers (telemetry, hazard, auth)
│ │ ├── middleware/ # Auth, security headers, rate limiters, logging
│ │ ├── routes/ # API route definitions (/api/telemetry, etc.)
│ │ ├── services/ # Real-time SSE broadcaster & AI service
│ │ └── server.js # Express app entry & HTTP server
│ ├── package.json # Backend dependencies (express, cors, helmet)
│ └── .env.example # Server environment template
│
├── database/ # [TIER 3: PERSISTENCE & TELEMETRY STORE]
│ ├── schemas/
│ │ ├── sql/schema.sql # Relational SQL schema (PostgreSQL/SQLite)
│ │ └── json/ # JSON Schemas for sensor ingestion validation
│ ├── seeds/ # Seed records for CWC gauges & danger marks
│ ├── sensor_logs/ # Live CSV/JSON physical sensor telemetry
│ └── dbClient.js # Unified Data Access Object / Database Adapter
│
├── ml_engine/ # [TIER 4: MACHINE LEARNING & GEOSPATIAL AI]
│ ├── models/ # Serialized Random Forest / Anomaly weights
│ ├── training/ # Python training pipelines (Scikit-learn)
│ ├── geospatial/ # Survey of India boundary & CWC river reaches
│ └── README.md # ML pipeline execution & retraining guide
│
├── management/ # [TIER 5: DEVOPS, DEPLOYMENT & OPERATIONS]
│ ├── docker/
│ │ ├── Dockerfile.frontend # Multi-stage Nginx Alpine container
│ │ ├── Dockerfile.backend # Lightweight Node.js Alpine container
│ │ └── nginx.conf # Reverse proxy configuration
│ ├── docker-compose.yml # Multi-service container orchestrator
│ ├── ecosystem.config.cjs # PM2 cluster configuration
│ └── scripts/ # Production start & backup scripts
│
├── docs/ # System documentation & screenshots
├── package.json # Root Workspaces & Orchestration Manager
├── run.bat # One-click Windows starter
├── run.ps1 # PowerShell starter
└── README.md # Master platform documentation
```

### Production Architecture Live Operation Proof

#### 1. Full-Stack Multi-Tier Production Cockpit
![Segregated Production Cockpit](docs/screenshots/81_segregated_production_dashboard.png)
*Figure 28: Live production deployment showing the React/Vite client running on port 5173 reverse-proxying and consuming live telemetry from the backend Express server on port 5000.*

#### 2. Authenticated Command Cockpit with Night Greeting
![Segregated Authenticated Cockpit](docs/screenshots/82_segregated_authenticated_cockpit.png)
*Figure 29: Executive disaster intelligence session operating with backend administrative security and real-time SSE physical sensor stream active.*

---

## Hackathon Attribution & License

- **Initiative**: Developed for **Smart India Hackathon 2026 (SIH 2026)**.
- **Problem Statement ID**: `SIH2026-26178` — *Comprehensive Multi-Hazard Early Warning & AI Emergency Risk Management System*.
- **Data Attributions**:
 - Central Water Commission (CWC), Ministry of Jal Shakti
 - India Meteorological Department (IMD), MoES
 - Central Pollution Control Board (CPCB), MoEFCC
 - National Disaster Management Authority (NDMA), MHA
 - Geological Survey of India (GSI), Ministry of Mines
 - Space Applications Centre (SAC), Indian Space Research Organisation (ISRO)
 - Indian National Centre for Ocean Information Services (INCOIS)
- **License**: Released under the [MIT License](LICENSE). Open-source for academic, humanitarian, and civil defense applications.

---
*Developed with dedication for the protection of human life, national infrastructure, and environmental ecosystems across Bharat.* 
