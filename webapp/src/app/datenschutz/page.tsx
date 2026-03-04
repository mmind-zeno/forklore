import Link from "next/link";
import { HeaderWithSuspense } from "@/components/HeaderWithSuspense";

export const metadata = {
  title: "Datenschutz – Forklore",
  description: "Datenschutzerklärung der Rezept-App Forklore inkl. KI-Verarbeitung",
};

export default function DatenschutzPage() {
  return (
    <div className="min-h-screen bg-cream">
      <HeaderWithSuspense />

      <main className="pt-24 px-6 py-8 pb-24 max-w-3xl mx-auto">
        <header className="mb-10">
          <Link
            href="/"
            className="text-terra hover:text-terra-dark font-bold text-sm inline-flex items-center gap-1 transition-colors"
          >
            ← Zurück
          </Link>
          <h1 className="mt-4 font-display text-4xl font-bold text-espresso">Datenschutz</h1>
          <p className="mt-3 text-espresso-mid text-sm">
            Allgemeine Datenschutzhinweise finden Sie auf{" "}
            <a
              href="https://mmind.ai/datenschutz"
              target="_blank"
              rel="noopener noreferrer"
              className="text-terra font-bold hover:underline"
            >
              mmind.ai/datenschutz
            </a>
            . Hier die app-spezifischen Hinweise zu Forklore.
          </p>
        </header>

        <div className="space-y-8 text-espresso-mid text-sm leading-relaxed">
          <section>
            <h2 className="font-display text-xl font-bold text-espresso mb-3">Verantwortliche Stelle</h2>
            <p>
              Betreiber und Verantwortlicher für Forklore ist mmind.ai. Kontakt:{" "}
              <a href="mailto:info@mmind.ai" className="text-terra font-bold hover:underline">
                info@mmind.ai
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-espresso mb-3">Einsatz von KI (Künstliche Intelligenz)</h2>
            <p className="mb-4">
              Forklore nutzt KI-Dienste, um Rezepte aus Text, Sprache und Bildern zu extrahieren und zu strukturieren:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Spracherkennung (Whisper/OpenAI):</strong> Bei Aufnahmen per Mikrofon wird Ihre Sprache in Text
                umgewandelt. Die Audio-Daten werden an den jeweiligen KI-Anbieter übertragen.
              </li>
              <li>
                <strong>Text- und Bildverarbeitung (GPT/OpenAI):</strong> Eingegebener Text und hochgeladene Fotos werden
                analysiert, um Zutaten, Zubereitungsschritte und Metadaten (Kategorie, Tags) zu erkennen.
              </li>
              <li>
                <strong>Bildgenerierung:</strong> Optional kann die App mit KI Rezeptbilder generieren. Dafür werden
                Rezeptdaten (u.&#8203;a. Titel, Zutaten) an externe Bildgenerierungsdienste übermittelt.
              </li>
            </ul>
            <p className="mt-4">
              Die Verarbeitung erfolgt über Drittanbieter (z.&#8203;B. OpenAI, Replicate). Deren Datenschutzbestimmungen
              gelten für die von ihnen verarbeiteten Daten. Wir setzen Dienste ein, die EU-konforme
              Datenverarbeitungsverträge anbieten, soweit verfügbar.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-espresso mb-3">Welche Daten erfasst Forklore?</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Kontodaten (E-Mail, Passwort-Hash, optional Name) bei Registrierung und Nutzung</li>
              <li>Rezepte (Text, Bilder), die Sie eingeben oder hochladen</li>
              <li>Sprachaufnahmen, wenn Sie den Mikrofon-Modus nutzen</li>
              <li>Technische Daten (IP, Browser, Zugriffszeiten) im üblichen Umfang für den Betrieb der App</li>
            </ul>
            <p className="mt-4">
              Rezepte können privat oder öffentlich gespeichert werden. Öffentliche Rezepte sind für alle Nutzer:innen
              sichtbar.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-espresso mb-3">Zweck und Rechtsgrundlage</h2>
            <p>
              Die Verarbeitung dient der Bereitstellung der Rezept-App und der Nutzung der KI-Funktionen. Rechtsgrundlage
              ist Art.&#8203;6 Abs.&#8203;1 lit.&#8203;b DSGVO (Vertragserfüllung) bzw. Ihre Einwilligung, wo erforderlich.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-espresso mb-3">Ihre Rechte</h2>
            <p>
              Sie haben das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung und
              Datenübertragbarkeit. Kontakt:{" "}
              <a href="mailto:info@mmind.ai" className="text-terra font-bold hover:underline">
                info@mmind.ai
              </a>
              . Beschwerden können Sie bei einer Aufsichtsbehörde einreichen.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
