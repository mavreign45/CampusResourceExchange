"""
Seed script for Campus Resource Exchange (Phase 2).
Populates the database with realistic, completely fictional campus resources.
Idempotent: safe to run multiple times without creating duplicates.
"""

import sys
import logging
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine, Base
from app.models.category import Category
from app.models.location import Location
from app.models.custodian import Custodian
from app.models.resource import Resource

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger("seed")

FICTIONAL_CATEGORIES = [
    {
        "name": "Laboratory Equipment",
        "description": "Scientific instruments, oscilloscopes, meters, and specialized lab measurement devices.",
    },
    {
        "name": "Computers & Electronics",
        "description": "Compute clusters, GPU workstations, developer kits, IoT modules, and embedded platforms.",
    },
    {
        "name": "Cameras & Media",
        "description": "Cinema cameras, digital lenses, studio microphones, lighting packages, and field recorders.",
    },
    {
        "name": "Engineering Tools",
        "description": "3D printers, CNC desktop milling stations, solder benches, and prototyping hardware.",
    },
    {
        "name": "Presentation Equipment",
        "description": "Laser projectors, conference display kits, wireless remotes, and stage presentation gear.",
    },
    {
        "name": "Other Resources",
        "description": "Specialized campus assets and multi-disciplinary academic equipment.",
    },
]

FICTIONAL_LOCATIONS = [
    {
        "building": "Turing Engineering Hall",
        "room": "Room 204",
        "campus_zone": "North Campus",
        "description": "Signals & Systems Prototyping Laboratory",
    },
    {
        "building": "Media Arts Center",
        "room": "Depot B-12",
        "campus_zone": "West Campus",
        "description": "Film & Digital Media Checkout Facility",
    },
    {
        "building": "Makerspace Innovation Hub",
        "room": "Bay 1",
        "campus_zone": "Central Campus",
        "description": "Rapid Prototyping & Fabrication Facility",
    },
    {
        "building": "Linus Torvalds Computer Science Complex",
        "room": "Lab 308",
        "campus_zone": "North Campus",
        "description": "Data Systems & Machine Learning Lab",
    },
    {
        "building": "Materials Science Research Center",
        "room": "Suite 115",
        "campus_zone": "South Campus",
        "description": "Thermal Dynamics & Spectroscopy Facility",
    },
    {
        "building": "Student Union & Conference Center",
        "room": "Suite 102",
        "campus_zone": "Central Campus",
        "description": "Audio-Visual Services Desk",
    },
    {
        "building": "Biomedical & Life Sciences Center",
        "room": "Core Lab 412",
        "campus_zone": "South Campus",
        "description": "Genomics & Bio-analytical Instrumentation Suite",
    },
    {
        "building": "Robotics & Advanced Manufacturing Pavilion",
        "room": "Cell 007",
        "campus_zone": "North Campus",
        "description": "Micro-Machining Precision Workshop",
    },
]

FICTIONAL_CUSTODIANS = [
    {
        "name": "Dr. Marcus Vance",
        "department": "Department of Electrical & Computer Engineering",
        "role": "Laboratory Director",
        "contact_email": "m.vance@university.example.edu",
        "office": "Turing Hall 210",
        "hours": "Mon-Thu 9:00 AM - 4:00 PM",
    },
    {
        "name": "Elena Rostova",
        "department": "School of Media Arts & Design",
        "role": "Equipment Checkout Specialist",
        "contact_email": "media.depot@university.example.edu",
        "office": "Media Arts B-14",
        "hours": "Mon-Fri 8:30 AM - 5:30 PM",
    },
    {
        "name": "Dave Kalu",
        "department": "Campus Makerspace & Fabrication Lab",
        "role": "Shop Manager",
        "contact_email": "makerspace@university.example.edu",
        "office": "Innovation Hub 104",
        "hours": "Mon-Sun 8:00 AM - 10:00 PM",
    },
    {
        "name": "Prof. Ananya Nair",
        "department": "School of Computing & Data Science",
        "role": "Research Computing Liaison",
        "contact_email": "a.nair@university.example.edu",
        "office": "CS Complex 412",
        "hours": "Tue/Thu 1:00 PM - 5:00 PM",
    },
    {
        "name": "Dr. Gregory Houseman",
        "department": "Department of Materials Science & Engineering",
        "role": "Instrumentation Specialist",
        "contact_email": "g.houseman@university.example.edu",
        "office": "Materials Center 120",
        "hours": "Mon-Fri 10:00 AM - 3:00 PM",
    },
    {
        "name": "Carlos Mendez",
        "department": "Campus Event Audio-Visual Services",
        "role": "Lead AV Coordinator",
        "contact_email": "avservices@university.example.edu",
        "office": "Student Union 102",
        "hours": "Mon-Sat 8:00 AM - 8:00 PM",
    },
    {
        "name": "Dr. Hiroshi Tanaka",
        "department": "Department of Bioengineering & Molecular Sciences",
        "role": "Genomics Core Manager",
        "contact_email": "h.tanaka@university.example.edu",
        "office": "Bio Center 415",
        "hours": "Mon-Fri 9:00 AM - 4:00 PM",
    },
    {
        "name": "Dr. Kimberly Vance",
        "department": "Department of Mechanical & Mechatronics Engineering",
        "role": "Shop Supervisor",
        "contact_email": "k.vance@university.example.edu",
        "office": "Robotics Pavilion 110",
        "hours": "Mon-Fri 8:00 AM - 4:30 PM",
    },
]

# 12 Realistic Fictional Campus Resources
FICTIONAL_RESOURCES = [
    {
        "id": "res-osc-01",
        "name": "Digital Storage Oscilloscope (100 MHz, 4-Channel)",
        "model_number": "Keysight DSOX1204G",
        "category_name": "Laboratory Equipment",
        "location_building": "Turing Engineering Hall",
        "location_room": "Room 204",
        "custodian_email": "m.vance@university.example.edu",
        "short_description": "4-channel 100MHz bandwidth digital oscilloscope with built-in waveform generator and SPI/I2C protocol decode.",
        "description": "The Keysight InfiniiVision DSOX1204G provides professional-grade measurements with a 100 MHz bandwidth across 4 analog channels and up to 2 GSa/s sampling rate. Includes a 20 MHz function generator and integrated serial protocol analysis for embedded systems prototyping and signal debugging.",
        "image_url": "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80",
        "availability_status": "available",
        "requires_verification": True,
        "requires_training": True,
        "requires_supervision": False,
        "training_requirement": "EE-101 Lab Safety & Equipment Handling Clearance",
        "eligibility": "Open to enrolled Electrical & Computer Engineering students and approved capstone teams.",
        "max_borrow_hours": 4,
        "max_borrow_duration": "4 Hours (In-Lab Only)",
        "item_condition": "Like New",
        "specifications": [
            "Bandwidth: 100 MHz, 4 Analog Channels",
            "Sample Rate: Up to 2 GSa/s per channel",
            "Display: 7-inch WVGA color LCD",
            "Protocol Decoding: I2C, SPI, UART/RS232",
            "Built-in 20 MHz Waveform Generator",
        ],
        "accessories_included": [
            "4x 10:1 Passive Probes",
            "BNC to Alligator Cable Set",
            "Power Cord & Calibration Certificate",
            "USB Interface Cable",
        ],
        "usage_guidelines": [
            "Equipment must remain strictly inside Room 204.",
            "Check calibration seals prior to powering up.",
            "Log off workstation and wipe probe clips after session.",
            "Immediately report any unexpected voltage overload warnings.",
        ],
    },
    {
        "id": "res-cam-02",
        "name": "DSLR Cinema Camera Kit (Sony FX3 Full-Frame)",
        "model_number": "Sony FX3 Cinema Line",
        "category_name": "Cameras & Media",
        "location_building": "Media Arts Center",
        "location_room": "Depot B-12",
        "custodian_email": "media.depot@university.example.edu",
        "short_description": "Full-frame cinema camera with 24-70mm f/2.8 GM lens, top XLR handle audio unit, and dual 160GB CFexpress cards.",
        "description": "Designed for high-end documentary and narrative media production, this Sony FX3 kit includes a full-frame 12.1MP back-illuminated Exmor R CMOS sensor, 4K 120p recording capability, 15+ stops of dynamic range with S-Cinetone color profile, and dedicated professional XLR audio inputs.",
        "image_url": "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80",
        "availability_status": "available",
        "requires_verification": True,
        "requires_training": True,
        "requires_supervision": False,
        "training_requirement": "Media Guild Camera Custody Certification (Level 2)",
        "eligibility": "Film, Journalism, and Visual Arts majors or students with faculty project endorsement.",
        "max_borrow_hours": 48,
        "max_borrow_duration": "48 Hours",
        "item_condition": "Like New",
        "specifications": [
            "12.1MP Full-Frame Exmor R CMOS Sensor",
            "UHD 4K up to 120p / 10-bit 4:2:2 internal recording",
            "Sony FE 24-70mm f/2.8 GM II Zoom Lens",
            "5-Axis In-Body Sensor-Shift Image Stabilization",
        ],
        "accessories_included": [
            "Pelican 1510 Watertight Hard Case",
            "XLR Handle Unit with Shotgun Mic Mount",
            "2x 160GB CFexpress Type A Cards + High-Speed Reader",
            "3x Sony NP-FZ100 Batteries + Dual Charger",
            "Variable ND Filter (82mm)",
        ],
        "usage_guidelines": [
            "Off-campus travel requires an explicit faculty field authorization form.",
            "Do not expose to rain or high humidity environments.",
            "Lens caps must be replaced whenever camera is not recording.",
            "Cards must be formatted and cleared before return.",
        ],
    },
    {
        "id": "res-prt-03",
        "name": "Dual-Extrusion 3D Printer (UltiMaker S5)",
        "model_number": "UltiMaker S5 Industrial",
        "category_name": "Engineering Tools",
        "location_building": "Makerspace Innovation Hub",
        "location_room": "Bay 1",
        "custodian_email": "makerspace@university.example.edu",
        "short_description": "Large-volume dual extrusion 3D printer for composite filaments, water-soluble support PVA, and functional prototyping.",
        "description": "The UltiMaker S5 delivers powerful, reliable additive manufacturing with a 330 x 240 x 300 mm build volume, dual print heads for multi-material prints and water-soluble supports, active bed leveling, and integrated material flow sensors. Ideal for mechanical engineering capstones and robotic enclosures.",
        "image_url": "https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=800&q=80",
        "availability_status": "in_use",
        "estimated_available_date": "Tomorrow at 2:00 PM",
        "requires_verification": True,
        "requires_training": True,
        "requires_supervision": False,
        "training_requirement": "Makerspace 3D Printing Induction & Cura Slicer Clearance",
        "eligibility": "All active university students, faculty, and cross-department innovation teams.",
        "max_borrow_hours": 12,
        "max_borrow_duration": "12 Hours (Print Queue Slot)",
        "item_condition": "Good",
        "specifications": [
            "Build Volume: 330 x 240 x 300 mm",
            "Layer Resolution: 20 to 600 microns",
            "Dual Extrusion with auto-nozzle lifting",
            "Supported Materials: PLA, Tough PLA, ABS, Nylon, TPU 95A, PVA",
        ],
        "accessories_included": [
            "Glass Print Bed & Flexible Steel Build Plate",
            "0.4mm and 0.8mm AA and BB Print Cores",
            "Filament Drybox Enclosure",
        ],
        "usage_guidelines": [
            "All G-code must be verified by a shop monitor before starting prints over 4 hours.",
            "Only campus-approved filament spools may be loaded.",
            "First 3 layers must be monitored in person before leaving the bay.",
        ],
    },
    {
        "id": "res-hpc-04",
        "name": "High-Performance Deep Learning Workstation",
        "model_number": "Lambda Vector AI (4x RTX 4090)",
        "category_name": "Computers & Electronics",
        "location_building": "Linus Torvalds Computer Science Complex",
        "location_room": "Lab 308",
        "custodian_email": "a.nair@university.example.edu",
        "short_description": "Dedicated AI/ML compute node equipped with quad RTX 4090 GPUs (96GB VRAM total) and 256GB ECC RAM for LLM fine-tuning.",
        "description": "This high-performance workstation is purpose-built for computational research, training computer vision models, fine-tuning open large language models, and running molecular dynamics simulations. Accessible both locally in the data lab and via secure campus SSH / JupyterLab portal.",
        "image_url": "https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&w=800&q=80",
        "availability_status": "available",
        "requires_verification": True,
        "requires_training": True,
        "requires_supervision": False,
        "training_requirement": "HPC Cluster Ethics & Resource Fairness Agreement",
        "eligibility": "Graduate students, honors thesis candidates, and authorized undergraduate researchers.",
        "max_borrow_hours": 72,
        "max_borrow_duration": "72 Hours Compute Allocation",
        "item_condition": "Like New",
        "specifications": [
            "GPUs: 4x NVIDIA RTX 4090 24GB (96GB VRAM total)",
            "CPU: AMD Threadripper PRO 5975WX (32 cores / 64 threads)",
            "Memory: 256GB DDR4 3200MHz ECC",
            "Storage: 4TB NVMe Gen4 Scratch Storage + 16TB RAID array",
            "Networking: Dual 10GbE fiber optic uplink",
        ],
        "accessories_included": [
            "Isolated research user sandbox",
            "Pre-installed PyTorch 2.4, CUDA 12.4, TensorFlow, and Docker",
            "JupyterHub web portal access credentials",
        ],
        "usage_guidelines": [
            "Compute jobs must implement checkpointing at least every 4 hours.",
            "FairShare scheduling applies; idle GPU sessions are reclaimed after 45 minutes.",
            "Strictly no cryptocurrency or commercial workloads.",
        ],
    },
    {
        "id": "res-thm-05",
        "name": "Handheld Thermal Imaging Camera (-20°C to 550°C)",
        "model_number": "FLIR E8-XT Pro",
        "category_name": "Laboratory Equipment",
        "location_building": "Materials Science Research Center",
        "location_room": "Suite 115",
        "custodian_email": "g.houseman@university.example.edu",
        "short_description": "Professional thermal imaging camera with MSX enhancement, 320x240 IR resolution, and Wi-Fi thermal reporting.",
        "description": "The FLIR E8-XT is an indispensable diagnostic tool for electrical inspections, PCB thermal distribution analysis, building energy audits, and mechanical stress evaluations. Featuring MSX (Multi-Spectral Dynamic Imaging) that embosses visual details onto the thermal scene.",
        "image_url": "https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&w=800&q=80",
        "availability_status": "available",
        "requires_verification": False,
        "requires_training": False,
        "requires_supervision": False,
        "training_requirement": None,
        "eligibility": "Open to all university students with a valid active student ID card.",
        "max_borrow_hours": 24,
        "max_borrow_duration": "24 Hours",
        "item_condition": "Good",
        "specifications": [
            "IR Resolution: 320 x 240 pixels (76,800 measurement points)",
            "Thermal Sensitivity / NETD: <0.05°C (50 mK)",
            "Temperature Range: -20°C to 550°C (-4°F to 1022°F)",
            "Field of View: 45° x 34°",
        ],
        "accessories_included": [
            "Protective Rugged Pelican Transport Case",
            "2x Rechargeable Li-Ion Battery Packs",
            "USB-C Transfer Cable & Power Supply",
            "FLIR Tools Analysis Software License",
        ],
        "usage_guidelines": [
            "Never aim sensor directly at the sun or high-power industrial laser sources.",
            "Calibrate blackbody zero point prior to critical scientific logging.",
            "Clean Germanium lens only with the provided optical microfiber cloth.",
        ],
    },
    {
        "id": "res-elk-06",
        "name": "Precision Electronics Prototyping & Testing Bench Kit",
        "model_number": "Keysight & Hakko Lab Bundle",
        "category_name": "Laboratory Equipment",
        "location_building": "Turing Engineering Hall",
        "location_room": "Room 204",
        "custodian_email": "m.vance@university.example.edu",
        "short_description": "Complete portable workbench kit including true RMS multimeter, triple-output DC power supply, and ESD-safe soldering station.",
        "description": "Comprehensive electronics workbench toolkit containing everything necessary for high-precision circuit assembly, SMD rework, and circuit diagnostic troubleshooting. Packaged in a modular rugged case for classroom, hackathon, and club workspace use.",
        "image_url": "https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?auto=format&fit=crop&w=800&q=80",
        "availability_status": "available",
        "requires_verification": False,
        "requires_training": False,
        "requires_supervision": False,
        "training_requirement": None,
        "eligibility": "Open to all engineering, CS, and robotics club members.",
        "max_borrow_hours": 72,
        "max_borrow_duration": "3 Days",
        "item_condition": "Like New",
        "specifications": [
            "Multimeter: Fluke 87V True-RMS Digital Multimeter",
            "DC Power Supply: Rigol DP832 (3-Channel, 195W Programmable)",
            "Soldering Station: Hakko FX-888D Digital Soldering Iron with chisel/conical tips",
            "Anti-Static: ESD-Safe conductive mat with grounding cord and wrist strap",
        ],
        "accessories_included": [
            "High-Grade Lead-Free Solder Spool (SAC305)",
            "Desoldering Wick & Vacuum Solder Sucker Pump",
            "Ceramic Anti-Magnetic Tweezers Set (6 Pcs)",
            "Silicon High-Temp Work Mat",
        ],
        "usage_guidelines": [
            "Soldering must be conducted near active fume extraction hoods.",
            "Verify tip temperature setting before handling delicate SMD ICs.",
            "Unplug soldering iron immediately upon completion of assembly.",
        ],
    },
    {
        "id": "res-prj-07",
        "name": "Ultra-Short Throw Laser Projector (4K, 5000 Lumens)",
        "model_number": "Epson Pro L1070U",
        "category_name": "Presentation Equipment",
        "location_building": "Student Union & Conference Center",
        "location_room": "Suite 102",
        "custodian_email": "avservices@university.example.edu",
        "short_description": "5000-lumen high-brightness laser projector for thesis defenses, symposiums, and interactive art installations.",
        "description": "Deliver striking large-format presentations and projection-mapping showcases with 5,000 lumens of equal color and white brightness. Features WUXGA resolution with 4K Enhancement Technology, 360-degree installation flexibility, and HDBaseT / HDMI 2.0 connectivity.",
        "image_url": "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=800&q=80",
        "availability_status": "maintenance",
        "estimated_available_date": "Friday at 9:00 AM",
        "requires_verification": False,
        "requires_training": False,
        "requires_supervision": False,
        "training_requirement": None,
        "eligibility": "Recognized student organizations, graduate researchers, and campus event organizers.",
        "max_borrow_hours": 24,
        "max_borrow_duration": "24 Hours",
        "item_condition": "Good",
        "specifications": [
            "Brightness: 5,000 Lumens (ISO 21118)",
            "Native Resolution: WUXGA (1920 x 1200) with 4K Enhancement",
            "Laser Light Engine: Up to 20,000 hours virtually maintenance-free",
            "Contrast Ratio: Over 2,500,000:1 Dynamic Contrast",
        ],
        "accessories_included": [
            "Heavy-duty Rolling Flight Case with padded dividers",
            "50ft High-Speed 4K HDMI Cable + DisplayPort/USB-C adapters",
            "Wireless Remote Control with laser pointer",
            "Adjustable presentation tripod stand",
        ],
        "usage_guidelines": [
            "Ensure cooling intake filters remain unblocked during operation.",
            "Allow laser shutdown sequence to complete before disconnecting power cable.",
            "Return all video adapters in their labeled pouches.",
        ],
    },
    {
        "id": "res-ard-08",
        "name": "Advanced IoT & Embedded Sensors Developer Kit",
        "model_number": "Arduino Pro & ESP32-S3 IoT Suite",
        "category_name": "Computers & Electronics",
        "location_building": "Makerspace Innovation Hub",
        "location_room": "Bay 1",
        "custodian_email": "makerspace@university.example.edu",
        "short_description": "Industrial-grade microcontroller prototyping suite with ESP32-S3 dual-core boards, environmental sensors, and LoRaWAN modules.",
        "description": "Ideal for IoT capstone projects, smart campus automation experiments, and wireless sensor networks. Includes Arduino GIGA R1 WiFi, ESP32-S3 dev boards, LoRaWAN transceivers, environmental sensor pods (air quality, temperature, humidity, pressure, accelerometer), and high-resolution OLED displays.",
        "image_url": "https://images.unsplash.com/photo-1553406830-ef2513450d76?auto=format&fit=crop&w=800&q=80",
        "availability_status": "available",
        "requires_verification": False,
        "requires_training": False,
        "requires_supervision": False,
        "training_requirement": None,
        "eligibility": "Open to all enrolled students with campus login.",
        "max_borrow_hours": 168,
        "max_borrow_duration": "7 Days",
        "item_condition": "Like New",
        "specifications": [
            "MCUs: Arduino GIGA R1 WiFi (STM32H7 dual-core Cortex-M7/M4) + 2x ESP32-S3",
            "Sensors: BME688 (Gas/VOC/Temp/Humidity), MPU-6050 6-Axis IMU, VL53L1X ToF LIDAR",
            "Wireless: Wi-Fi 6, BLE 5.0, HopeRF RFM95W LoRa Transceiver (915MHz)",
            "Actuators: Micro servo motors, solid-state relay modules, tactile rotary encoders",
        ],
        "accessories_included": [
            "Modular acrylic storage organizer with labeled compartments",
            "Half-size and full-size solderless breadboards (4 Pcs)",
            "Comprehensive jumper wire bundle (M-M, M-F, F-F)",
            "USB-C and Micro-USB braided cables",
        ],
        "usage_guidelines": [
            "Please verify all components are returned to their designated numbered slots.",
            "Do not apply voltages greater than 5V directly to GPIO header pins.",
            "Notify staff if any sensor breaks so we can replenish the inventory.",
        ],
    },
    {
        "id": "res-cnc-09",
        "name": "Desktop CNC Precision Milling Machine",
        "model_number": "Bantam Tools Desktop CNC",
        "category_name": "Engineering Tools",
        "location_building": "Robotics & Advanced Manufacturing Pavilion",
        "location_room": "Cell 007",
        "custodian_email": "k.vance@university.example.edu",
        "short_description": "Compact high-speed CNC mill optimized for double-sided custom PCB prototyping and aluminum soft tooling.",
        "description": "The Bantam Tools Desktop CNC Milling Machine delivers rapid 2.5D and 3D precision manufacturing directly on a workbench. Capable of cutting FR-1 circuit boards, Delrin, HDPE, brass, and aluminum with 0.001 inch precision and 28,000 RPM spindle speeds.",
        "image_url": "https://images.unsplash.com/photo-1581092162384-8987c1d64718?auto=format&fit=crop&w=800&q=80",
        "availability_status": "available",
        "requires_verification": True,
        "requires_training": True,
        "requires_supervision": True,
        "training_requirement": "CNC Mill Safety Protocol & Speeds/Feeds Workshop Certification",
        "eligibility": "Engineering undergraduates and graduate researchers with certified badge.",
        "max_borrow_hours": 6,
        "max_borrow_duration": "6 Hours (Scheduled Session)",
        "item_condition": "Good",
        "specifications": [
            "Work Area: 7 x 9 x 3.3 inches (178 x 228 x 84 mm)",
            "Spindle Speed: 10,000 to 28,000 RPM",
            "Positional Resolution: 0.0001 in (0.0025 mm)",
            "Collet System: ER-11 (1/8 in and 1/4 in precision collets)",
        ],
        "accessories_included": [
            "High-Speed Steel & Carbide Endmill Starter Set",
            "High-Adhesion Nitto Double-Sided Fixturing Tape",
            "Probing Bit & Automated Tool Height Touchplate",
            "HEPA Vacuum Swarf Enclosure",
        ],
        "usage_guidelines": [
            "Personal Protective Equipment (ANSI Z87.1 glasses) must be worn at all times.",
            "Enclosure door interlock safety switch must never be bypassed.",
            "Clean all chips and swarf thoroughly before signing out.",
        ],
    },
    {
        "id": "res-vr-10",
        "name": "Spatial Computing & VR Development Kit (Meta Quest Pro)",
        "model_number": "Meta Quest Pro 256GB Dev Edition",
        "category_name": "Computers & Electronics",
        "location_building": "Media Arts Center",
        "location_room": "Depot B-12",
        "custodian_email": "media.depot@university.example.edu",
        "short_description": "Enterprise mixed-reality headset featuring high-resolution color passthrough, eye tracking, and face tracking.",
        "description": "Equipped with pancake optics, stereoscopic color passthrough, inside-out tracked Touch Pro controllers, and inward-facing eye/face tracking cameras. Excellent for research into human-computer interaction, telepresence, architectural walkthroughs, and spatial computing simulation.",
        "image_url": "https://images.unsplash.com/photo-1593508512255-86ab42a8e620?auto=format&fit=crop&w=800&q=80",
        "availability_status": "available",
        "requires_verification": False,
        "requires_training": False,
        "requires_supervision": False,
        "training_requirement": None,
        "eligibility": "Open to all computer science, game design, and digital humanities students.",
        "max_borrow_hours": 120,
        "max_borrow_duration": "5 Days",
        "item_condition": "Like New",
        "specifications": [
            "Optics: Dual 1800 x 1920 pixels per eye Pancake lenses",
            "Tracking: Inward face & eye tracking, 10 advanced VR/MR sensors",
            "Memory & Storage: 12GB RAM, 256GB High-Speed Storage",
            "Connectivity: Wi-Fi 6E, Bluetooth 5.2, USB-C Link 5Gbps",
        ],
        "accessories_included": [
            "2x Meta Quest Touch Pro Self-Tracking Controllers",
            "Magnetic Rapid Wireless Charging Dock & 45W Adapter",
            "Magnetic Partial Light Blockers",
            "Link High-Speed 5-Meter Fiber Optic Cable",
        ],
        "usage_guidelines": [
            "Wipe facial silicone interface only with non-alcoholic sanitizing wipes.",
            "Ensure 2x2 meter Guardian boundary is clear of physical obstacles during use.",
            "Return on charging dock with controllers aligned to magnetic contacts.",
        ],
    },
    {
        "id": "res-bio-11",
        "name": "UV-Visible Micro-Volume Spectrophotometer",
        "model_number": "Thermo Scientific NanoDrop OneC",
        "category_name": "Laboratory Equipment",
        "location_building": "Biomedical & Life Sciences Center",
        "location_room": "Core Lab 412",
        "custodian_email": "h.tanaka@university.example.edu",
        "short_description": "Full-spectrum UV-Vis microvolume spectrophotometer for DNA, RNA, and protein quantification with 1-2 µL sample sizes.",
        "description": "The NanoDrop OneC spectrophotometer uses patented sample retention technology that measures microvolume samples (0.5 to 2.0 µL) without cuvettes or dilutions. Features integrated Wi-Fi, touch screen Android interface, and Acclaro Sample Intelligence technology that identifies chemical contaminants in nucleic acid samples.",
        "image_url": "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=800&q=80",
        "availability_status": "in_use",
        "estimated_available_date": "Today at 5:30 PM",
        "requires_verification": True,
        "requires_training": True,
        "requires_supervision": False,
        "training_requirement": "Biosafety Level 1 (BSL-1) & Bio-analytical Instrumentation Training",
        "eligibility": "Biology, Biochemistry, and Bioengineering majors and faculty lab researchers.",
        "max_borrow_hours": 2,
        "max_borrow_duration": "2 Hours (Benchtop Slot)",
        "item_condition": "Like New",
        "specifications": [
            "Pathlength: 0.03 to 1.0 mm auto-ranging",
            "Wavelength Range: 190 to 850 nm (Xenon flash lamp)",
            "Wavelength Accuracy: ±1 nm",
            "Detection Limit: 2.0 ng/µL dsDNA, 0.06 mg/mL BSA",
        ],
        "accessories_included": [
            "Dedicated calibration check fluid vial",
            "Lint-free Kimwipes station",
            "Deionized water wash bottle and vacuum aspiration pipet",
        ],
        "usage_guidelines": [
            "Clean pedestal surfaces immediately after each sample using deionized water.",
            "Do not apply metal tips or abrasive tools to optical quartz sampling surfaces.",
            "Export test spectra to campus OneDrive folder; local cache is purged weekly.",
        ],
    },
    {
        "id": "res-aud-12",
        "name": "Multi-Track 6-Channel Field Audio Recorder",
        "model_number": "Zoom H6 All-Black Handy Recorder",
        "category_name": "Cameras & Media",
        "location_building": "Media Arts Center",
        "location_room": "Depot B-12",
        "custodian_email": "media.depot@university.example.edu",
        "short_description": "6-channel portable audio recorder with interchangeable X/Y and mid-side microphone capsules and 4 XLR/TRS combo inputs.",
        "description": "The Zoom H6 provides pristine 24-bit/96kHz audio recording directly to SD cards. Equipped with four pristine mic preamps with phantom power, ultra-low noise floor, physical gain knobs, and interchangeable modular mic capsules. Perfect for oral histories, podcast interviews, and field acoustics measurements.",
        "image_url": "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=800&q=80",
        "availability_status": "available",
        "requires_verification": False,
        "requires_training": False,
        "requires_supervision": False,
        "training_requirement": None,
        "eligibility": "Open to all university students and podcast/radio club members.",
        "max_borrow_hours": 48,
        "max_borrow_duration": "48 Hours",
        "item_condition": "Good",
        "specifications": [
            "Channels: 6 Simultaneous recording tracks",
            "Sampling: Up to 24-bit/96kHz resolution in BWF-compliant WAV",
            "Inputs: 4x XLR/TRS combo jacks with -20dB pads and phantom power",
            "Battery Life: Over 20 hours of continuous recording on 4x AA batteries",
        ],
        "accessories_included": [
            "XYH-6 X/Y Stereo Microphone Capsule",
            "MSH-6 Mid-Side Stereo Microphone Capsule",
            "Furry Deadcat Windscreen & Foam Pop Shield",
            "64GB SanDisk Extreme SD Card + USB Reader",
            "Padded Cordura Carrying Bag with shoulder strap",
        ],
        "usage_guidelines": [
            "Always test mic input levels with headphones before initiating live recording.",
            "Enable limiter or backup recording (-12dB safety track) during dynamic interviews.",
            "Inspect battery life indicator prior to remote field expeditions.",
        ],
    },
]


def seed_database(db: Session = None):
    """
    Safely seeds categories, locations, custodians, and resources into the database.
    Does not duplicate records if they already exist.
    """
    close_after = False
    if db is None:
        db = SessionLocal()
        close_after = True

    try:
        logger.info("Checking and seeding categories...")
        category_map = {}
        for cat_data in FICTIONAL_CATEGORIES:
            cat = db.scalar(select(Category).where(Category.name == cat_data["name"]))
            if not cat:
                cat = Category(**cat_data)
                db.add(cat)
                db.flush()
                logger.info(f"  + Added category: {cat.name}")
            category_map[cat.name] = cat.id

        logger.info("Checking and seeding locations...")
        location_map = {}
        for loc_data in FICTIONAL_LOCATIONS:
            loc_key = f"{loc_data['building']}::{loc_data['room']}"
            loc = db.scalar(
                select(Location).where(
                    Location.building == loc_data["building"],
                    Location.room == loc_data["room"],
                )
            )
            if not loc:
                loc = Location(**loc_data)
                db.add(loc)
                db.flush()
                logger.info(f"  + Added location: {loc.building} ({loc.room})")
            location_map[loc_key] = loc.id

        logger.info("Checking and seeding custodians...")
        custodian_map = {}
        for cust_data in FICTIONAL_CUSTODIANS:
            cust = db.scalar(
                select(Custodian).where(Custodian.contact_email == cust_data["contact_email"])
            )
            if not cust:
                cust = Custodian(**cust_data)
                db.add(cust)
                db.flush()
                logger.info(f"  + Added custodian: {cust.name}")
            custodian_map[cust.contact_email] = cust.id

        logger.info("Checking and seeding resources...")
        seeded_count = 0
        for res_data in FICTIONAL_RESOURCES:
            res_id = res_data["id"]
            existing = db.scalar(select(Resource).where(Resource.id == res_id))

            cat_id = category_map[res_data["category_name"]]
            loc_key = f"{res_data['location_building']}::{res_data['location_room']}"
            loc_id = location_map[loc_key]
            cust_id = custodian_map[res_data["custodian_email"]]

            payload = {
                "id": res_id,
                "name": res_data["name"],
                "model_number": res_data["model_number"],
                "category_id": cat_id,
                "location_id": loc_id,
                "custodian_id": cust_id,
                "short_description": res_data["short_description"],
                "description": res_data["description"],
                "image_url": res_data["image_url"],
                "availability_status": res_data["availability_status"],
                "estimated_available_date": res_data.get("estimated_available_date"),
                "requires_verification": res_data["requires_verification"],
                "requires_training": res_data["requires_training"],
                "requires_supervision": res_data["requires_supervision"],
                "training_requirement": res_data.get("training_requirement"),
                "eligibility": res_data.get("eligibility"),
                "max_borrow_hours": res_data["max_borrow_hours"],
                "max_borrow_duration": res_data["max_borrow_duration"],
                "item_condition": res_data["item_condition"],
                "specifications": res_data["specifications"],
                "accessories_included": res_data["accessories_included"],
                "usage_guidelines": res_data["usage_guidelines"],
            }

            if not existing:
                res = Resource(**payload)
                db.add(res)
                seeded_count += 1
                logger.info(f"  + Added resource: {res.name} [{res.id}]")
            else:
                # Update fields if needed
                for k, v in payload.items():
                    setattr(existing, k, v)

        db.commit()
        logger.info(f"Database seed complete! Processed {len(FICTIONAL_RESOURCES)} resources ({seeded_count} newly created).")

        # Optional Phase 3: Bootstrap administrator if configured in .env
        from app.services.auth_service import AuthService
        bootstrapped = AuthService.bootstrap_admin_if_configured(db)
        if bootstrapped:
            logger.info(f"Bootstrap administrator confirmed: {bootstrapped.email}")

    except Exception as e:
        db.rollback()
        logger.error(f"Seeding failed: {e}")
        raise e
    finally:
        if close_after:
            db.close()


if __name__ == "__main__":
    seed_database()
