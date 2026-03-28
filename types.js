export var EquipmentStatus;
(function (EquipmentStatus) {
    EquipmentStatus["OPERATIONAL"] = "Operacional";
    EquipmentStatus["DOWN"] = "Parado";
    EquipmentStatus["WARNING"] = "Alerta/Aten\u00E7\u00E3o";
})(EquipmentStatus || (EquipmentStatus = {}));
export var CargoStatus;
(function (CargoStatus) {
    CargoStatus["PROGRAMADO"] = "PROGRAMADO";
    CargoStatus["CARREGANDO"] = "CARREGANDO";
    CargoStatus["FINALIZADO"] = "FINALIZADO";
    CargoStatus["ATRASADO"] = "ATRASADO";
})(CargoStatus || (CargoStatus = {}));
export var VehicleStatus;
(function (VehicleStatus) {
    VehicleStatus["AVAILABLE"] = "Dispon\u00EDvel";
    VehicleStatus["IN_USE"] = "Em Opera\u00E7\u00E3o";
    VehicleStatus["MAINTENANCE"] = "Manuten\u00E7\u00E3o";
    VehicleStatus["WASHING"] = "Em Lavagem";
})(VehicleStatus || (VehicleStatus = {}));
export var UserRole;
(function (UserRole) {
    UserRole["ADMIN"] = "Administrador";
    UserRole["MANAGER"] = "Gerente";
    UserRole["OPERATOR"] = "Operador";
})(UserRole || (UserRole = {}));
export var TyreStatus;
(function (TyreStatus) {
    TyreStatus["STOCK"] = "Estoque";
    TyreStatus["MOUNTED"] = "Montado";
    TyreStatus["REPAIRED"] = "Reparo";
    TyreStatus["SCRAP"] = "Descarte";
})(TyreStatus || (TyreStatus = {}));
export var TyrePosition;
(function (TyrePosition) {
    TyrePosition["FL"] = "Dian. Esq.";
    TyrePosition["FR"] = "Dian. Dir.";
    TyrePosition["RL"] = "Tras. Esq. Ext.";
    TyrePosition["RLI"] = "Tras. Esq. Int.";
    TyrePosition["RR"] = "Tras. Dir. Ext.";
    TyrePosition["RRI"] = "Tras. Dir. Int.";
})(TyrePosition || (TyrePosition = {}));
