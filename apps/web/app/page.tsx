import { redirect } from "next/navigation";


export default function Home() {
  redirect("/login")
  return (
    <div>
      <main>
        <h1 className="text-primary">Landing Page Welcom</h1>

        <p>Lorem ipsum dolor sit amet.</p>
      </main>

    </div>
  );
}
