class CorevixException(Exception):
    """Excepción base del proyecto."""
    pass


class DatabaseConnectionError(CorevixException):
    """Error al conectar con la base de datos."""
    pass


class ScannerError(CorevixException):
    """Error durante el escaneo de la red."""
    pass


class DeviceNotFoundError(CorevixException):
    """No se encontró el dispositivo solicitado."""
    pass


class ConfigurationError(CorevixException):
    """Error en la configuración del sistema."""
    pass