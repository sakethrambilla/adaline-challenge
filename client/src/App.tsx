import DirectorySidebar from "./components/directory/DirectorySidebar";

export default function App() {
  return (
    <main className="flex min-h-screen w-full flex-col gap-4 bg-secondary p-4">
      {/* Directory Edit Sidebar */}
      <DirectorySidebar />
    </main>
  );
}
