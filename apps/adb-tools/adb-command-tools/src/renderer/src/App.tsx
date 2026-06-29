import AppContent from "./components/Appcontent"
import AppFooter from "./components/AppFooter"
import AppTitle from "./components/AppTitle"


function App(): React.JSX.Element {
  const ipcHandle = (): void => window.electron.ipcRenderer.send('ping')

  return (
    <div className="w-full sm:max-w-5xl  xl:max-w-7xl mx-auto h-screen">
      <div className=" flex flex-col justify-between items-center h-full w-full">
        <div className="flex-1 w-full p-5">
          <AppTitle />
          <AppContent />
        </div>
        <div>
          <AppFooter />
        </div>
      </div>
    </div>
  )
}

export default App
