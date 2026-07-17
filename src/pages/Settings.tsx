import { useRef, useState } from 'react'
import { useAuth } from '../auth/useAuth'
import TaxonomyManager from '../components/TaxonomyManager'
import { clearBackups, listBackups, type Backup } from '../data/backups'
import { clearLocalData } from '../data/adapters/LocalAdapter'
import { downloadExport, parseImport } from '../data/importExport'
import { isStorageNearFull } from '../data/storage'
import { extractData, useStore } from '../store/useStore'
import { formatCurrency } from '../utils/format'

export default function Settings() {
  const store = useStore()
  const { user, deleteAccount } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [backups, setBackups] = useState<Backup[]>(() => listBackups())
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [budgetCapInput, setBudgetCapInput] = useState(
    store.settings.budgetCap?.toString() ?? '',
  )

  const notify = (text: string) => {
    setError(null)
    setMessage(text)
  }

  const handleExport = () => {
    downloadExport(extractData(store))
    store.markExported()
    notify('הקובץ יוצא בהצלחה')
  }

  const handleImportFile = async (file: File) => {
    try {
      const data = parseImport(await file.text())
      const summary = `${data.tasks.length} משימות, ${data.purchases.length} רכישות, ${data.contacts.length} אנשי קשר`
      if (!window.confirm(`הייבוא יחליף את כל הנתונים הקיימים (${summary}). להמשיך?`)) return
      store.replaceAll(data)
      setBackups(listBackups())
      notify('הנתונים יובאו בהצלחה')
    } catch (e) {
      setMessage(null)
      setError(e instanceof Error ? e.message : 'הייבוא נכשל')
    }
  }

  const handleRestore = (backup: Backup) => {
    if (!window.confirm('לשחזר את הנתונים מגיבוי זה? המצב הנוכחי יישמר כגיבוי.')) return
    store.replaceAll(backup.data)
    setBackups(listBackups())
    notify('הגיבוי שוחזר')
  }

  const handleSaveBudgetCap = () => {
    const value = Number(budgetCapInput)
    store.setBudgetCap(budgetCapInput && value > 0 ? value : undefined)
    notify('התקציב הכולל נשמר')
  }

  const handleDeleteLocal = () => {
    if (!window.confirm('למחוק לצמיתות את כל הנתונים המקומיים בדפדפן זה? מומלץ לייצא לקובץ קודם.')) return
    clearLocalData()
    clearBackups()
    window.location.reload()
  }

  const handleDeleteAccount = async () => {
    if (!window.confirm('למחוק את חשבון ההתחברות שלכם? הלוח המשותף עצמו לא יימחק.')) return
    try {
      await deleteAccount()
      notify('החשבון נמחק')
    } catch {
      setMessage(null)
      setError('מחיקת החשבון נכשלה. נסו להתנתק ולהתחבר מחדש ואז לנסות שוב.')
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">הגדרות</h2>

      {message && <div className="rounded-md bg-green-50 p-3 text-green-800">{message}</div>}
      {error && <div className="rounded-md bg-red-50 p-3 text-red-800">{error}</div>}
      {isStorageNearFull() && (
        <div className="rounded-md bg-amber-50 p-3 text-amber-800">
          שטח האחסון בדפדפן מתקרב לקצה גבולו. מומלץ לייצא לקובץ ולשקול מחיקת פריטים ישנים.
        </div>
      )}

      <section className="rounded-lg bg-white p-4 shadow-sm">
        <h3 className="mb-2 font-semibold">תקציב כולל</h3>
        <p className="mb-3 text-sm text-slate-500">
          הגדרה אופציונלית — תצוגת התקציב תתריע אם ההוצאה הצפויה חורגת.
        </p>
        <div className="flex gap-2">
          <input
            type="number"
            min="0"
            value={budgetCapInput}
            onChange={(e) => setBudgetCapInput(e.target.value)}
            placeholder="למשל 250000"
            className="w-40 rounded-md border border-slate-300 px-3 py-1.5"
          />
          <button
            onClick={handleSaveBudgetCap}
            className="rounded-md bg-teal-600 px-4 py-1.5 text-white hover:bg-teal-700"
          >
            שמירה
          </button>
        </div>
        {store.settings.budgetCap && (
          <p className="mt-2 text-sm text-slate-500">
            תקציב נוכחי: {formatCurrency(store.settings.budgetCap)}
          </p>
        )}
      </section>

      <TaxonomyManager
        title="קטגוריות"
        items={store.categories}
        onAdd={(name) => store.addCategory(name)}
        onRename={store.renameCategory}
        onDelete={store.deleteCategory}
        deleteWarning={(name) => `למחוק את הקטגוריה "${name}"? היא תוסר מכל המשימות והרכישות המשויכות.`}
      />

      <TaxonomyManager
        title="חדרים"
        items={store.rooms}
        onAdd={store.addRoom}
        onRename={store.renameRoom}
        onDelete={store.deleteRoom}
        deleteWarning={(name) => `למחוק את החדר "${name}"? הוא יוסר מכל המשימות והרכישות המשויכות.`}
      />

      <section className="rounded-lg bg-white p-4 shadow-sm">
        <h3 className="mb-2 font-semibold">גיבוי ושחזור</h3>
        <p className="mb-3 text-sm text-slate-500">
          הנתונים נשמרים בדפדפן בלבד. מומלץ לייצא לקובץ מדי פעם לגיבוי חיצוני.
          {store.settings.lastExportAt &&
            ` ייצוא אחרון: ${new Date(store.settings.lastExportAt).toLocaleString('he-IL')}`}
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleExport}
            className="rounded-md bg-teal-600 px-4 py-1.5 text-white hover:bg-teal-700"
          >
            ייצוא לקובץ
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="rounded-md border border-teal-600 px-4 py-1.5 text-teal-700 hover:bg-teal-50"
          >
            ייבוא מקובץ
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) void handleImportFile(file)
              e.target.value = ''
            }}
          />
        </div>
      </section>

      <section className="rounded-lg bg-white p-4 shadow-sm">
        <h3 className="mb-2 font-semibold">גיבויים אוטומטיים</h3>
        {backups.length === 0 ? (
          <p className="text-sm text-slate-500">אין עדיין גיבויים אוטומטיים.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {backups.map((backup) => (
              <li key={backup.savedAt} className="flex items-center justify-between py-2">
                <span className="text-sm">
                  {new Date(backup.savedAt).toLocaleString('he-IL')} — {backup.data.tasks.length}{' '}
                  משימות, {backup.data.purchases.length} רכישות
                </span>
                <button
                  onClick={() => handleRestore(backup)}
                  className="rounded-md border border-slate-300 px-3 py-1 text-sm hover:bg-slate-50"
                >
                  שחזור
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-lg bg-white p-4 shadow-sm">
        <h3 className="mb-2 font-semibold">פרטיות ומחיקת נתונים</h3>
        <div className="space-y-2 text-sm text-slate-500">
          <p>
            במצב אורח כל הנתונים נשמרים אך ורק בדפדפן שלכם ואינם נשלחים לשום מקום. בהתחברות, נתוני
            הלוח המשותף (משימות, רכישות, אנשי קשר על פרטיהם, וסכומים) נשמרים ב-Firebase ונגישים רק
            לכתובות שברשימת המורשים.
          </p>
          <p>
            ניתן לייצא את כל הנתונים לקובץ בכל עת (למעלה). למחיקת גישה מהלוח המשותף — פנו לבעל הלוח
            להסרת הכתובת מרשימת המורשים.
          </p>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={handleDeleteLocal}
            className="rounded-md border border-red-300 px-4 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            מחיקת הנתונים המקומיים בדפדפן
          </button>
          {user && (
            <button
              onClick={handleDeleteAccount}
              className="rounded-md border border-red-300 px-4 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
            >
              מחיקת חשבון ההתחברות
            </button>
          )}
        </div>
      </section>
    </div>
  )
}
