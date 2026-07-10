import AppTitle from "@components/AppTitle";
import AppContent from "@components/Appcontent";
import AppFooter from "@components/AppFooter";

function App() {
  return (
    <div className="mx-auto flex h-screen w-full flex-col sm:max-w-5xl xl:max-w-7xl">
      <div className="flex min-h-0 flex-1 flex-col px-6 pt-6">
        <AppTitle />
        <AppContent />
      </div>
      <AppFooter />
    </div>
  );
}

export default App;
