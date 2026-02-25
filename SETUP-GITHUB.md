# GitHub-Repository erstellen

Das Git-Repository ist eingerichtet. Du musst nur noch das Repo auf GitHub anlegen und pushen.

## 1. Repo auf GitHub erstellen

1. Gehe zu **https://github.com/new**
2. **Repository name:** `forklore` (oder `recipes-app`)
3. **Public** auswählen
4. **Nicht** "Add a README" – das Projekt existiert bereits
5. Auf **Create repository** klicken

## 2. Pushen

```powershell
cd c:\_DATA\600_github\Forklore
git push -u origin main
```

Falls du einen anderen Repo-Namen gewählt hast:

```powershell
git remote set-url origin https://github.com/mmind-zeno/DEIN-REPO-NAME.git
git push -u origin main
```

## Fertig

Danach ist Forklore unter **https://github.com/mmind-zeno/forklore** verfügbar.
