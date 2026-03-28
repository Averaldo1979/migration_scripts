-- Extensão para UUID se necessário
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabelas principais baseadas nos tipos do frontend

CREATE TABLE IF NOT EXISTS units (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT,
    responsible TEXT,
    address TEXT,
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS teams (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    number TEXT,
    unit_id TEXT REFERENCES units(id) ON DELETE SET NULL,
    status TEXT,
    target_staff JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vehicles (
    id TEXT PRIMARY KEY,
    plate TEXT NOT NULL,
    model TEXT,
    brand TEXT,
    year INTEGER,
    model_year INTEGER,
    exercise_year TEXT,
    vehicle_type TEXT,
    owner_name TEXT,
    capacity NUMERIC,
    km NUMERIC,
    next_maintenance_km NUMERIC,
    unit_id TEXT REFERENCES units(id) ON DELETE SET NULL,
    status TEXT,
    photo_url TEXT,
    documents JSONB,
    telemetry JSONB,
    last_exit_km NUMERIC,
    last_exit_date TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS drivers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    cpf TEXT,
    role TEXT,
    department TEXT,
    team_id TEXT REFERENCES teams(id) ON DELETE SET NULL,
    unit_id TEXT REFERENCES units(id) ON DELETE SET NULL,
    admission_date TEXT,
    last_vacation_date TEXT,
    leased_cnpj TEXT,
    license_number TEXT,
    license_category TEXT,
    license_expiry TEXT,
    status TEXT,
    phone TEXT,
    email TEXT,
    profile_photo TEXT,
    license_file TEXT,
    courses JSONB,
    equipe TEXT,
    data_admissao TEXT,
    funcao TEXT,
    salary NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS fuel_stations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT,
    brand TEXT,
    latitude TEXT,
    longitude TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS fuel_logs (
    id TEXT PRIMARY KEY,
    vehicle_id TEXT REFERENCES vehicles(id) ON DELETE CASCADE,
    driver_id TEXT REFERENCES drivers(id) ON DELETE SET NULL,
    fuel_station_id TEXT REFERENCES fuel_stations(id) ON DELETE SET NULL,
    fuel_type TEXT,
    date TEXT NOT NULL,
    liters NUMERIC,
    unit_price NUMERIC,
    discount NUMERIC,
    cost NUMERIC,
    km NUMERIC,
    invoice_number TEXT,
    team_id TEXT REFERENCES teams(id) ON DELETE SET NULL,
    unit_id TEXT REFERENCES units(id) ON DELETE SET NULL,
    pump_photo_url TEXT,
    receipt_photo_url TEXT,
    odometer_photo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS maintenance_logs (
    id TEXT PRIMARY KEY,
    vehicle_id TEXT REFERENCES vehicles(id) ON DELETE CASCADE,
    unit_id TEXT REFERENCES units(id) ON DELETE SET NULL,
    team_id TEXT REFERENCES teams(id) ON DELETE SET NULL,
    date TEXT NOT NULL,
    type TEXT,
    description TEXT,
    unit_price NUMERIC,
    quantity NUMERIC,
    cost NUMERIC,
    km NUMERIC,
    team TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS suppliers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    cnpj TEXT,
    category TEXT,
    contact_name TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS washing_logs (
    id TEXT PRIMARY KEY,
    vehicle_id TEXT REFERENCES vehicles(id) ON DELETE CASCADE,
    driver_id TEXT REFERENCES drivers(id) ON DELETE SET NULL,
    driver_name TEXT,
    supplier_id TEXT REFERENCES suppliers(id) ON DELETE SET NULL,
    unit_id TEXT REFERENCES units(id) ON DELETE SET NULL,
    team_id TEXT REFERENCES teams(id) ON DELETE SET NULL,
    date TEXT NOT NULL,
    type TEXT,
    cost NUMERIC,
    km NUMERIC,
    observations TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS app_users (
    id TEXT PRIMARY KEY,
    name TEXT,
    email TEXT UNIQUE NOT NULL,
    username TEXT,
    password TEXT,
    role TEXT,
    status TEXT,
    "allowedMenus" JSONB,
    team_number TEXT,
    allowed_teams JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS checklists (
    id TEXT PRIMARY KEY,
    vehicle_id TEXT REFERENCES vehicles(id) ON DELETE CASCADE,
    driver_id TEXT REFERENCES drivers(id) ON DELETE SET NULL,
    unit_id TEXT REFERENCES units(id) ON DELETE SET NULL,
    team_id TEXT REFERENCES teams(id) ON DELETE SET NULL,
    date TEXT NOT NULL,
    items JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tyres (
    id TEXT PRIMARY KEY,
    serial_number TEXT NOT NULL,
    brand TEXT,
    model TEXT,
    size TEXT,
    type TEXT,
    status TEXT,
    initial_thread_depth NUMERIC,
    current_thread_depth NUMERIC,
    purchase_date TEXT,
    supplier TEXT,
    invoice_number TEXT,
    unit_value NUMERIC,
    photo_url TEXT,
    vehicle_id TEXT REFERENCES vehicles(id) ON DELETE SET NULL,
    position TEXT,
    km_at_mount NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tyre_audits (
    id TEXT PRIMARY KEY,
    tyre_id TEXT REFERENCES tyres(id) ON DELETE CASCADE,
    date TEXT NOT NULL,
    depth NUMERIC,
    km NUMERIC,
    inspector TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tyre_movements (
    id TEXT PRIMARY KEY,
    tyre_id TEXT REFERENCES tyres(id) ON DELETE CASCADE,
    vehicle_id TEXT REFERENCES vehicles(id) ON DELETE SET NULL,
    date TEXT NOT NULL,
    type TEXT,
    km NUMERIC,
    position TEXT,
    observations TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tyre_repairs (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    vehicle_id TEXT REFERENCES vehicles(id) ON DELETE SET NULL,
    partner_id TEXT,
    quantity NUMERIC,
    unit_value NUMERIC,
    description TEXT,
    observations TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ppe_items (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT,
    certificate_number TEXT,
    ca_expiry_date TEXT,
    size TEXT,
    current_stock NUMERIC,
    min_stock NUMERIC,
    unit_value NUMERIC,
    manufacturer TEXT,
    photo_url TEXT,
    ca_file_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ppe_movements (
    id TEXT PRIMARY KEY,
    ppe_id TEXT REFERENCES ppe_items(id) ON DELETE CASCADE,
    person_id TEXT,
    person_name TEXT,
    date TEXT NOT NULL,
    type TEXT,
    quantity NUMERIC,
    unit_value NUMERIC,
    total_value NUMERIC,
    batch_id TEXT,
    size TEXT,
    invoice_number TEXT,
    certificate_number TEXT,
    observations TEXT,
    responsible_user TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS equipments (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT,
    serial_number TEXT,
    manufacturer TEXT,
    installation_date TEXT,
    unit_id TEXT REFERENCES units(id) ON DELETE SET NULL,
    status TEXT,
    last_maintenance_date TEXT,
    photo_url TEXT,
    team TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS equipment_maintenance_logs (
    id TEXT PRIMARY KEY,
    equipment_id TEXT REFERENCES equipments(id) ON DELETE CASCADE,
    unit_id TEXT REFERENCES units(id) ON DELETE SET NULL,
    date TEXT NOT NULL,
    type TEXT,
    description TEXT,
    responsible TEXT,
    cost NUMERIC,
    duration_hours NUMERIC,
    parts_replaced TEXT,
    technical_observations TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS odometer_logs (
    id TEXT PRIMARY KEY,
    vehicle_id TEXT REFERENCES vehicles(id) ON DELETE CASCADE,
    km NUMERIC,
    date TEXT NOT NULL,
    type TEXT,
    driver_id TEXT REFERENCES drivers(id) ON DELETE SET NULL,
    trip_km NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS attendance (
    id TEXT PRIMARY KEY,
    collaborator_id TEXT REFERENCES drivers(id) ON DELETE CASCADE,
    team_id TEXT REFERENCES teams(id) ON DELETE SET NULL,
    date TEXT NOT NULL,
    status TEXT,
    recorded_by TEXT,
    replaced_by_diarista BOOLEAN,
    diarista_name TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS charges (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    team_id TEXT REFERENCES teams(id) ON DELETE SET NULL,
    birds_count NUMERIC,
    tons NUMERIC,
    charges_count NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS history_logs (
    id TEXT PRIMARY KEY,
    table_name TEXT,
    record_id TEXT,
    action TEXT,
    old_data JSONB,
    new_data JSONB,
    changed_by TEXT,
    changed_at TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS cargas (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    team_id TEXT REFERENCES teams(id) ON DELETE SET NULL,
    birds_count NUMERIC,
    tons NUMERIC,
    cargas_count NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS hr_events (
    id TEXT PRIMARY KEY,
    collaborator_id TEXT REFERENCES drivers(id) ON DELETE CASCADE,
    type TEXT,
    start_date TEXT,
    end_date TEXT,
    description TEXT,
    responsible TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS fuel_types (
    id TEXT PRIMARY KEY,
    name TEXT,
    category TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tyre_brands (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tyre_models (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    brand_id TEXT REFERENCES tyre_brands(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS team_role_values (
    id TEXT PRIMARY KEY,
    role TEXT NOT NULL UNIQUE,
    load_value NUMERIC DEFAULT 0,
    value NUMERIC DEFAULT 0,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
