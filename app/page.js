import Link from "next/link";

export default function HomePage() {
  return (
    <main className="landing">
      <div>
        <h1>Flashback</h1>
        <p>
          Seal a memory today. Set a date. The capsule opens — for you and anyone
          you share it with — only when that date arrives.
        </p>
        <div className="landingActions">
          <Link className="btn primary" href="/register">Get started</Link>
          <Link className="btn ghost" href="/login">Login</Link>
        </div>
      </div>
    </main>
  );
}
