export default function Settings() {
  return (
    <div className="min-h-screen bg-stone-50">
      <main className="p-8">
        <h2 className="text-3xl font-light text-slate-800 mb-8">Settings</h2>

        <div className="space-y-6">
          <div className="p-6 border rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Test Configuration</h3>
            <p className="text-muted-foreground">
              Configure your default test settings and Puppeteer options.
            </p>
            {/* Add your settings form components here later */}
          </div>

          <div className="p-6 border rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Account Settings</h3>
            <p className="text-muted-foreground">
              Manage your account preferences and profile information.
            </p>
            {/* Add account settings here later */}
          </div>
        </div>
      </main>
    </div>
  );
}
