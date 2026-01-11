export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-gray-200 px-4 py-4 lg:px-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm text-gray-600">
        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4">
          <p className="font-medium">Sistema de Gestión - Deportes Laboulaye</p>
          <p className="text-xs sm:text-sm">
            <span className="inline-block w-2 h-2 bg-green-400 rounded-full mr-2"></span>
            Versión 1.0.0
          </p>
        </div>
        
        <div className="mt-2 sm:mt-0">
          <p className="text-xs sm:text-sm">
            © {currentYear} Deportes Laboulaye. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}