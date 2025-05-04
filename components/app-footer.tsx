export function AppFooter() {
  const currentYear = new Date().getFullYear()
    
      return (
          <footer className="bg-sky-100 py-4 text-center text-sky-700 shadow-inner">
                <div className="container mx-auto px-4">
                        <p className="font-medium">© {currentYear} School Schedule Manager. All rights reserved.</p>
                                <p className="text-sm mt-1 opacity-90 hover:opacity-100 transition-opacity">
                                          Developed with <span className="text-red-500">❤️ by Prakash</span> for SARC
                                                  </p>
                                                        </div>
                                                            </footer>
                                                              )
                                                              }
