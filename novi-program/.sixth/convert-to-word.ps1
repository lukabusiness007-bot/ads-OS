# PowerShell skript za konverziju Markdown-a u Word dokument

# Čitanje markdown fajla
$markdownPath = "c:\Users\PC\OneDrive\Desktop\Novi proram\.sixth\PLAN_Administrator_male_poslove.md"
$wordPath = "c:\Users\PC\OneDrive\Desktop\Novi proram\.sixth\PLAN_Administrator_male_poslove.docx"

# Čitanje sadržaja
$content = Get-Content -Path $markdownPath -Raw

# Kreiranje Word aplikacije
$word = New-Object -ComObject Word.Application
$word.Visible = $false

# Kreiranje novog dokumenta
$doc = $word.Documents.Add()

# Dodavanje teksta u dokument
$doc.Content.Text = $content

# Čuvanje kao .docx
$doc.SaveAs2($wordPath, [Microsoft.Office.Interop.Word.WdSaveFormat]::wdFormatDocm)

# Zatvaranje
$doc.Close()
$word.Quit()

Write-Host "Word dokument kreiran: $wordPath"
