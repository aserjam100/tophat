export default async function ViewTest({ params }) {
  const { testId } = await params;

  return (
    <div>
      <h1>Test: {testId}</h1>
      {/* Your test viewing logic here */}
    </div>
  );
}
