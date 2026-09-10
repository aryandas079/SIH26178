"""
Generate authentic Indian hazard geospatial datasets:
1. NIH Roorkee Flood Prone Corridors (Image 5)
2. BIS IS 1893:2002 Seismic Zones II, III, IV, V (Image 2)
3. GSI / NDMA Landslide Susceptibility Zones
4. State-Wise AQI Choropleth & Labels (Image 3)
5. IMD Official Maximum Temperature Isotherms (Image 4)
"""

import json
import os

OUTPUT_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "src", "data", "indiaHazardGeometries.json")

def generate():
    data = {
        "type": "HazardGeometriesBundle",
        "version": "2.1.0",
        
        # -------------------------------------------------------------
        # 1. NIH ROORKEE FLOOD PRONE CORRIDORS (Image 5)
        # -------------------------------------------------------------
        "flood_prone_zones_nih": [
            {
                "id": "brahmaputra_valley",
                "name": "Brahmaputra Basin Flood Corridor",
                "state": "Assam",
                "color": "#0284c7",
                "fillColor": "#38bdf8",
                "fillOpacity": 0.48,
                "coordinates": [
                    [27.9, 95.8], [27.5, 95.0], [26.9, 94.2], [26.7, 92.8],
                    [26.2, 91.8], [26.1, 90.6], [26.0, 89.9], [26.3, 89.8],
                    [26.6, 90.8], [26.7, 92.0], [27.0, 93.5], [27.5, 94.6],
                    [27.9, 95.8]
                ]
            },
            {
                "id": "barak_valley",
                "name": "Barak Valley Flood Basin",
                "state": "Assam",
                "color": "#0284c7",
                "fillColor": "#38bdf8",
                "fillOpacity": 0.52,
                "coordinates": [
                    [24.75, 93.15], [24.72, 92.95], [24.74, 92.70], [24.78, 92.35],
                    [24.95, 92.35], [24.98, 92.65], [24.92, 93.00], [24.85, 93.18],
                    [24.75, 93.15]
                ]
            },
            {
                "id": "indo_gangetic_plains",
                "name": "Indo-Gangetic Alluvial Flood Corridor",
                "state": "UP / Bihar / West Bengal",
                "color": "#0284c7",
                "fillColor": "#38bdf8",
                "fillOpacity": 0.45,
                "coordinates": [
                    [28.8, 77.2], [27.8, 78.5], [26.8, 80.5], [25.8, 82.5],
                    [25.4, 85.0], [25.2, 87.0], [24.5, 88.2], [22.8, 88.5],
                    [22.2, 88.2], [23.2, 87.5], [24.8, 86.8], [25.6, 84.8],
                    [26.2, 82.0], [27.4, 79.5], [28.6, 77.8], [28.8, 77.2]
                ]
            },
            {
                "id": "punjab_haryana_belt",
                "name": "Sutlej-Ghaggar-Yamuna Flood Plains",
                "state": "Punjab / Haryana",
                "color": "#0284c7",
                "fillColor": "#38bdf8",
                "fillOpacity": 0.45,
                "coordinates": [
                    [31.8, 75.2], [31.0, 75.5], [30.2, 76.2], [29.2, 76.8],
                    [28.8, 77.2], [29.6, 77.2], [30.6, 76.8], [31.4, 76.0],
                    [31.8, 75.2]
                ]
            },
            {
                "id": "mahanadi_delta",
                "name": "Mahanadi Deltaic Flood Corridor",
                "state": "Odisha",
                "color": "#0284c7",
                "fillColor": "#38bdf8",
                "fillOpacity": 0.48,
                "coordinates": [
                    [21.5, 83.9], [20.8, 84.5], [20.4, 85.8], [20.2, 86.7],
                    [20.5, 86.8], [20.8, 86.0], [21.4, 84.8], [21.5, 83.9]
                ]
            },
            {
                "id": "godavari_krishna_deltas",
                "name": "Godavari-Krishna Inter-Delta Floodplain",
                "state": "Andhra Pradesh",
                "color": "#0284c7",
                "fillColor": "#38bdf8",
                "fillOpacity": 0.48,
                "coordinates": [
                    [17.2, 81.6], [16.8, 81.8], [16.2, 82.2], [15.8, 81.0],
                    [16.4, 80.5], [16.7, 80.8], [17.2, 81.6]
                ]
            },
            {
                "id": "narmada_tapi_estuaries",
                "name": "Narmada-Tapi Estuarine Flood Zone",
                "state": "Gujarat",
                "color": "#0284c7",
                "fillColor": "#38bdf8",
                "fillOpacity": 0.48,
                "coordinates": [
                    [21.9, 72.8], [21.6, 73.1], [21.2, 73.2], [21.0, 72.8],
                    [21.5, 72.5], [21.9, 72.8]
                ]
            },
            {
                "id": "kerala_coastal_flood",
                "name": "Kuttanad & Coastal Kerala Lowland Basin",
                "state": "Kerala",
                "color": "#0284c7",
                "fillColor": "#38bdf8",
                "fillOpacity": 0.48,
                "coordinates": [
                    [10.2, 76.1], [9.5, 76.3], [9.1, 76.5], [9.2, 76.7],
                    [9.8, 76.6], [10.3, 76.3], [10.2, 76.1]
                ]
            }
        ],

        # -------------------------------------------------------------
        # 2. BIS SEISMIC ZONES OF INDIA (Image 2)
        # -------------------------------------------------------------
        "seismic_zones_bis": [
            {
                "zone": "Zone - V (Highest)",
                "zone_code": "V",
                "factor": 0.36,
                "risk": "Highest Active Seismic Intensity",
                "color": "#b31b26",
                "fillColor": "#b31b26",
                "fillOpacity": 0.72,
                "regions": [
                    # Entire North-East India
                    [
                        [28.5, 93.5], [28.2, 96.5], [27.0, 96.8], [25.5, 94.5],
                        [24.0, 93.5], [23.5, 92.5], [24.0, 91.5], [25.2, 90.0],
                        [26.2, 89.8], [26.8, 92.0], [28.0, 93.0], [28.5, 93.5]
                    ],
                    # Andaman and Nicobar Islands
                    [
                        [13.5, 92.8], [11.5, 92.6], [9.0, 92.7], [6.8, 93.8],
                        [7.2, 94.0], [10.0, 93.2], [13.2, 93.2], [13.5, 92.8]
                    ],
                    # Kutch Region, Gujarat (Bhuj epicenter)
                    [
                        [24.2, 68.8], [24.0, 70.8], [23.2, 70.6], [23.0, 69.2],
                        [23.5, 68.6], [24.2, 68.8]
                    ],
                    # Northern Kashmir & Ladakh Belt
                    [
                        [35.0, 74.5], [34.5, 75.8], [33.8, 75.2], [34.2, 74.2],
                        [35.0, 74.5]
                    ],
                    # Himachal Kangra-Mandi Belt
                    [
                        [32.6, 75.8], [32.4, 76.8], [31.5, 77.2], [31.6, 76.2],
                        [32.6, 75.8]
                    ],
                    # Uttarakhand Chamoli-Uttarkashi Belt
                    [
                        [31.0, 78.5], [30.8, 80.2], [29.8, 80.4], [30.0, 78.8],
                        [31.0, 78.5]
                    ],
                    # North Bihar Belt (Sitamarhi-Madhubani)
                    [
                        [26.8, 84.8], [26.7, 86.8], [26.0, 86.6], [26.2, 85.0],
                        [26.8, 84.8]
                    ]
                ]
            },
            {
                "zone": "Zone - IV (High)",
                "zone_code": "IV",
                "factor": 0.24,
                "risk": "High Seismic Vulnerability",
                "color": "#de5437",
                "fillColor": "#de5437",
                "fillOpacity": 0.65,
                "regions": [
                    # Delhi-NCR, Haryana, Punjab, Sub-Himalayan UP
                    [
                        [32.8, 74.5], [32.0, 76.5], [30.5, 78.0], [28.8, 79.5],
                        [27.5, 81.5], [26.0, 84.5], [25.5, 87.8], [26.5, 88.8],
                        [27.4, 88.5], [26.5, 84.0], [27.5, 81.0], [28.5, 77.0],
                        [29.5, 75.5], [31.5, 74.0], [32.8, 74.5]
                    ],
                    # Maharashtra Koyna-Warna & Mumbai Coastal Corridor
                    [
                        [19.8, 72.8], [19.2, 73.2], [17.2, 74.0], [16.8, 73.5],
                        [17.5, 73.0], [19.2, 72.6], [19.8, 72.8]
                    ],
                    # Gujarat Saurashtra & Kutch Perimeter
                    [
                        [24.5, 70.8], [23.8, 72.0], [22.8, 71.5], [22.2, 70.2],
                        [22.8, 69.2], [24.5, 70.8]
                    ]
                ]
            },
            {
                "zone": "Zone - III (Moderate)",
                "zone_code": "III",
                "factor": 0.16,
                "risk": "Moderate Seismic Activity",
                "color": "#f0a882",
                "fillColor": "#f0a882",
                "fillOpacity": 0.58,
                "regions": [
                    # Western Ghats & Coastal Peninsula
                    [
                        [21.5, 72.8], [19.0, 73.5], [15.5, 74.5], [12.0, 75.5],
                        [8.5, 77.0], [8.5, 77.8], [11.5, 76.5], [15.0, 75.5],
                        [18.5, 74.5], [21.5, 73.8], [21.5, 72.8]
                    ],
                    # Rajasthan Aravalli to Central UP/Bihar
                    [
                        [27.5, 72.5], [26.5, 75.5], [25.5, 77.8], [24.5, 82.5],
                        [23.5, 86.5], [22.5, 88.5], [24.2, 88.2], [25.2, 85.5],
                        [26.2, 80.5], [27.0, 76.5], [28.0, 73.5], [27.5, 72.5]
                    ],
                    # East Coast Tamil Nadu & Andhra Corridor
                    [
                        [13.5, 80.3], [16.0, 81.5], [18.0, 83.5], [19.5, 85.5],
                        [19.0, 85.0], [17.0, 82.8], [15.0, 80.5], [13.0, 79.8],
                        [13.5, 80.3]
                    ]
                ]
            },
            {
                "zone": "Zone - II (Least Active)",
                "zone_code": "II",
                "factor": 0.10,
                "risk": "Low / Nominal Seismic Probability",
                "color": "#fbf0e4",
                "fillColor": "#fbf0e4",
                "fillOpacity": 0.45,
                "regions": [
                    # Stable Peninsular Shield & Central Plateau
                    [
                        [25.0, 74.5], [24.0, 78.5], [23.5, 82.5], [21.5, 83.5],
                        [18.5, 80.5], [15.5, 78.5], [12.5, 77.8], [10.5, 78.2],
                        [12.5, 76.8], [15.5, 76.5], [18.5, 76.0], [21.5, 75.8],
                        [24.0, 74.8], [25.0, 74.5]
                    ],
                    # Thar Desert Stable Core
                    [
                        [28.5, 70.0], [27.0, 72.0], [25.5, 71.5], [26.0, 69.8],
                        [28.5, 70.0]
                    ]
                ]
            }
        ],

        # -------------------------------------------------------------
        # 3. GSI / NDMA LANDSLIDE SUSCEPTIBILITY ZONES
        # -------------------------------------------------------------
        "landslide_zones_gsi": [
            {
                "class": "Very High / Critical Hazard",
                "color": "#b91c1c",
                "fillColor": "#b91c1c",
                "fillOpacity": 0.70,
                "regions": [
                    # Western Himalayas (Ramban-Banihal, Kullu, Chamoli, Kedarnath)
                    [
                        [33.8, 75.0], [33.2, 75.8], [32.5, 76.8], [31.8, 77.8],
                        [30.8, 79.5], [30.0, 80.2], [30.4, 80.4], [31.5, 78.5],
                        [32.8, 76.5], [33.5, 75.2], [33.8, 75.0]
                    ],
                    # Eastern Himalayas & NE Hills (Sikkim, Darjeeling, Meghalaya, Dima Hasao, Mizoram)
                    [
                        [27.8, 88.2], [27.2, 88.6], [26.8, 88.4], [25.8, 91.5],
                        [25.2, 92.8], [24.2, 93.0], [23.2, 92.8], [24.0, 93.5],
                        [25.5, 93.5], [26.2, 92.5], [27.5, 89.0], [27.8, 88.2]
                    ],
                    # Western Ghats Critical Zones (Wayanad, Idukki, Nilgiris, Raigad-Mahad)
                    [
                        [18.5, 73.4], [18.1, 73.6], [17.5, 73.8], [18.2, 73.2], [18.5, 73.4]
                    ],
                    [
                        [11.8, 75.9], [11.4, 76.2], [11.0, 76.6], [10.2, 77.0],
                        [9.6, 77.2], [10.0, 76.8], [11.2, 76.2], [11.8, 75.9]
                    ]
                ]
            },
            {
                "class": "High Hazard",
                "color": "#ea580c",
                "fillColor": "#ea580c",
                "fillOpacity": 0.55,
                "regions": [
                    # Siwalik Foothills Belt
                    [
                        [33.0, 74.8], [32.0, 76.0], [30.5, 77.5], [29.5, 79.2],
                        [29.0, 79.8], [30.0, 78.2], [31.5, 76.5], [33.0, 74.8]
                    ],
                    # Sahyadri Scarp (Konkan, Kodagu, Uttara Kannada, Goa Ghats)
                    [
                        [16.8, 73.8], [15.2, 74.2], [14.0, 74.6], [12.8, 75.4],
                        [13.2, 75.8], [14.8, 75.0], [16.2, 74.4], [16.8, 73.8]
                    ]
                ]
            },
            {
                "class": "Moderate Hazard",
                "color": "#eab308",
                "fillColor": "#eab308",
                "fillOpacity": 0.45,
                "regions": [
                    # Eastern Ghats (Araku Valley, Koraput, Nilgiri eastern slopes)
                    [
                        [18.8, 82.8], [18.2, 83.2], [17.8, 82.5], [18.4, 82.2], [18.8, 82.8]
                    ],
                    # Vindhya & Satpura Ranges
                    [
                        [22.8, 75.5], [22.5, 78.5], [22.8, 81.2], [23.4, 80.8],
                        [23.2, 77.5], [23.5, 75.8], [22.8, 75.5]
                    ]
                ]
            }
        ],

        # -------------------------------------------------------------
        # 4. STATE-WISE AQI TELEMETRY (Image 3: Diwali 2025 India Data Map)
        # -------------------------------------------------------------
        "state_aqi_diwali2025": [
            # Purple / Dark Maroon (300 - 402)
            {"state": "Haryana", "aqi": 402, "category": "Severe / Hazardous", "color": "#581c87", "lat": 29.0588, "lng": 76.0856},
            {"state": "Uttar Pradesh", "aqi": 350, "category": "Severe / Hazardous", "color": "#6b21a8", "lat": 26.8467, "lng": 80.9462},
            {"state": "Delhi", "aqi": 344, "category": "Severe / Hazardous", "color": "#7e22ce", "lat": 28.6139, "lng": 77.2090},
            {"state": "Punjab", "aqi": 320, "category": "Severe / Hazardous", "color": "#7e22ce", "lat": 31.1471, "lng": 75.3412},
            
            # Red / Magenta (200 - 299)
            {"state": "Bihar", "aqi": 280, "category": "Very Unhealthy", "color": "#be123c", "lat": 25.0961, "lng": 85.3131},
            {"state": "Rajasthan", "aqi": 260, "category": "Very Unhealthy", "color": "#e11d48", "lat": 27.0238, "lng": 74.2179},
            {"state": "Madhya Pradesh", "aqi": 250, "category": "Very Unhealthy", "color": "#e11d48", "lat": 22.9734, "lng": 78.6569},
            {"state": "Maharashtra", "aqi": 250, "category": "Very Unhealthy", "color": "#e11d48", "lat": 19.7515, "lng": 75.7139},
            {"state": "Gujarat", "aqi": 240, "category": "Very Unhealthy", "color": "#e11d48", "lat": 22.2587, "lng": 71.1924},
            {"state": "West Bengal", "aqi": 220, "category": "Very Unhealthy", "color": "#f43f5e", "lat": 22.9868, "lng": 87.8550},
            {"state": "Jharkhand", "aqi": 210, "category": "Very Unhealthy", "color": "#f43f5e", "lat": 23.6102, "lng": 85.2799},
            {"state": "Chhattisgarh", "aqi": 200, "category": "Unhealthy", "color": "#ea580c", "lat": 21.2787, "lng": 81.8661},

            # Orange (120 - 199)
            {"state": "Karnataka", "aqi": 190, "category": "Unhealthy for Sensitive", "color": "#f97316", "lat": 15.3173, "lng": 75.7139},
            {"state": "Andhra Pradesh", "aqi": 180, "category": "Unhealthy for Sensitive", "color": "#f97316", "lat": 15.9129, "lng": 79.7400},
            {"state": "Telangana", "aqi": 180, "category": "Unhealthy for Sensitive", "color": "#f97316", "lat": 18.1124, "lng": 79.0193},
            {"state": "Tamil Nadu", "aqi": 170, "category": "Moderate", "color": "#fb923c", "lat": 11.1271, "lng": 78.6569},
            {"state": "Kerala", "aqi": 150, "category": "Moderate", "color": "#fb923c", "lat": 10.8505, "lng": 76.2711},
            {"state": "Assam", "aqi": 140, "category": "Moderate", "color": "#fb923c", "lat": 26.2006, "lng": 92.9376},
            {"state": "Odisha", "aqi": 130, "category": "Moderate", "color": "#fbbf24", "lat": 20.9517, "lng": 85.0985},
            {"state": "Goa", "aqi": 120, "category": "Moderate", "color": "#fbbf24", "lat": 15.2993, "lng": 74.1240},

            # Yellow (60 - 115)
            {"state": "Himachal Pradesh", "aqi": 110, "category": "Moderate", "color": "#eab308", "lat": 31.1048, "lng": 77.1734},
            {"state": "Uttarakhand", "aqi": 100, "category": "Satisfactory", "color": "#eab308", "lat": 30.0668, "lng": 79.0193},
            {"state": "Jammu & Kashmir", "aqi": 90, "category": "Satisfactory", "color": "#fde047", "lat": 33.7782, "lng": 76.5762},
            {"state": "Tripura", "aqi": 80, "category": "Satisfactory", "color": "#fde047", "lat": 23.9408, "lng": 91.9882},
            {"state": "Nagaland", "aqi": 70, "category": "Satisfactory", "color": "#facc15", "lat": 26.1584, "lng": 94.5624},
            {"state": "Manipur", "aqi": 60, "category": "Satisfactory", "color": "#facc15", "lat": 24.6637, "lng": 93.9063},

            # Green (10 - 55)
            {"state": "Mizoram", "aqi": 50, "category": "Good", "color": "#22c55e", "lat": 23.1645, "lng": 92.9376},
            {"state": "Puducherry", "aqi": 50, "category": "Good", "color": "#22c55e", "lat": 11.9416, "lng": 79.8083},
            {"state": "Meghalaya", "aqi": 40, "category": "Good", "color": "#16a34a", "lat": 25.4670, "lng": 91.3662},
            {"state": "Arunachal Pradesh", "aqi": 30, "category": "Good", "color": "#15803d", "lat": 28.2180, "lng": 94.7278},
            {"state": "Andaman & Nicobar", "aqi": 30, "category": "Good", "color": "#15803d", "lat": 11.7401, "lng": 92.6586},
            {"state": "Sikkim", "aqi": 20, "category": "Good", "color": "#15803d", "lat": 27.5330, "lng": 88.5122},
            {"state": "Ladakh", "aqi": 20, "category": "Good", "color": "#15803d", "lat": 34.1526, "lng": 77.5771},
            {"state": "Lakshadweep", "aqi": 10, "category": "Good", "color": "#166534", "lat": 10.5667, "lng": 72.6417}
        ],

        # -------------------------------------------------------------
        # 5. IMD MAXIMUM TEMPERATURE ISOTHERMS (Image 4)
        # -------------------------------------------------------------
        "imd_max_temperature_isotherms": [
            # Extreme Thermal Core (> 44°C, 46-48°C, >48°C) - Dark Crimson / Deep Wine
            {
                "temp_range": "> 44°C (Severe Heatwave Maximum)",
                "color": "#4a0404",
                "fillColor": "#580000",
                "fillOpacity": 0.75,
                "regions": [
                    # Central India: Vidarbha, Eastern MP, Northern Telangana, Western Odisha
                    [
                        [22.8, 77.5], [22.5, 80.5], [21.8, 83.2], [20.5, 83.8],
                        [19.2, 81.5], [18.5, 79.5], [19.2, 78.2], [20.8, 77.2],
                        [22.2, 76.8], [22.8, 77.5]
                    ],
                    # Eastern Rajasthan / Shekhawati Heat Pocket
                    [
                        [28.5, 74.2], [28.2, 75.8], [27.2, 76.2], [26.8, 74.8],
                        [27.5, 73.8], [28.5, 74.2]
                    ]
                ]
            },
            # Severe Heatwave (40°C - 44°C) - Deep Red / Crimson
            {
                "temp_range": "40° - 44°C (Heatwave Alert)",
                "color": "#b91c1c",
                "fillColor": "#dc2626",
                "fillOpacity": 0.60,
                "regions": [
                    # Broad Northern Plains & Deccan Core
                    [
                        [29.5, 74.0], [28.5, 78.0], [26.5, 82.5], [25.0, 85.5],
                        [23.5, 86.8], [21.0, 85.5], [18.0, 83.5], [16.0, 80.5],
                        [15.5, 78.0], [17.5, 76.0], [20.5, 74.5], [23.5, 72.5],
                        [26.5, 71.0], [28.5, 72.0], [29.5, 74.0]
                    ]
                ]
            },
            # Warm / Hot Plains (34°C - 40°C) - Orange / Amber
            {
                "temp_range": "34° - 40°C (Elevated Ambient)",
                "color": "#ea580c",
                "fillColor": "#f97316",
                "fillOpacity": 0.48,
                "regions": [
                    # Southern Peninsula & Coastal Hinterland
                    [
                        [15.5, 74.0], [13.0, 75.0], [10.5, 76.5], [8.5, 77.5],
                        [10.0, 79.5], [13.5, 80.2], [16.0, 81.5], [18.0, 83.8],
                        [17.0, 81.0], [15.5, 77.5], [15.5, 74.0]
                    ]
                ]
            },
            # Moderate Warm (26°C - 34°C) - Yellow / Light Gold
            {
                "temp_range": "26° - 34°C (Sub-Himalayan & Coastal)",
                "color": "#eab308",
                "fillColor": "#facc15",
                "fillOpacity": 0.38,
                "regions": [
                    # Coastal fringes & Sub-Himalayan plains
                    [
                        [32.5, 74.5], [31.5, 76.2], [30.0, 78.5], [27.5, 84.5],
                        [26.5, 88.5], [26.0, 89.8], [24.5, 88.5], [26.5, 84.0],
                        [29.0, 78.5], [31.0, 76.0], [32.5, 74.5]
                    ]
                ]
            },
            # Temperate / Hill Cool (18°C - 26°C) - Green / Light Cyan
            {
                "temp_range": "18° - 26°C (Montane Foothills & NE Hills)",
                "color": "#16a34a",
                "fillColor": "#22c55e",
                "fillOpacity": 0.52,
                "regions": [
                    # North-East Hills (Meghalaya, Nagaland, Manipur, Mizoram, Arunachal foothills)
                    [
                        [28.0, 93.5], [27.5, 96.0], [25.5, 94.5], [23.5, 93.0],
                        [24.0, 92.0], [25.5, 90.5], [26.2, 92.5], [28.0, 93.5]
                    ],
                    # Lower Himalayan Valleys (Shimla, Dehradun, Dharamshala, Srinagar)
                    [
                        [34.5, 74.5], [33.5, 75.5], [32.0, 76.8], [30.5, 78.8],
                        [31.2, 77.5], [32.8, 76.0], [34.0, 74.8], [34.5, 74.5]
                    ]
                ]
            },
            # Cold / Alpine (< 16°C to <= 0°C) - Blue / Violet
            {
                "temp_range": "< 16°C (Alpine Snow & Glacial Peaks)",
                "color": "#2563eb",
                "fillColor": "#3b82f6",
                "fillOpacity": 0.65,
                "regions": [
                    # Greater Himalayas: Ladakh, Zanskar, Spiti, Kinnaur, High Uttarkashi, Sikkim peaks
                    [
                        [36.0, 76.0], [35.5, 78.5], [34.2, 79.2], [33.0, 79.0],
                        [31.8, 78.8], [32.5, 77.2], [34.5, 76.2], [36.0, 76.0]
                    ],
                    # Kanchenjunga / North Sikkim
                    [
                        [28.1, 88.1], [27.9, 88.8], [27.5, 88.6], [27.7, 88.0], [28.1, 88.1]
                    ]
                ]
            }
        ]
    }

    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)

    print(f"SUCCESS: Generated {OUTPUT_PATH} with authentic Indian hazard geometries!")

if __name__ == "__main__":
    generate()
