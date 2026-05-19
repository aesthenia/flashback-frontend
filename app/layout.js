import "./globals.css";
import { AuthProvider, NavBar } from "../components/auth";

export const metadata = {
  title: "Flashback",
  description: "Time capsules — sealed memories that open on a date.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <NavBar />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
