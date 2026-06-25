# PreparationApp - Documentation Générale

## Description
PreparationApp est une application de gestion des préparations pour les formateurs.
Elle permet de :
- Gérer les formateurs et leurs disponibilités.
- Synchroniser les préparations avec Google Calendar.
- Exporter/Importer des données depuis Google Sheets.

---

## Technologies Utilisées
   Composant       | Technologie               | Version       |
 |-----------------|---------------------------|---------------|
 | Backend         | ASP.NET Core              | 10.0          |
 | Base de données | SQL Server                | 2022          |
 | Frontend        | React 			           | 18.x          |
 | Authentification| Google OAuth2 + JWT       | -             |
 | API Google      | Calendar API, Sheets API  | v3, v4        |

---

## Prérequis
- [.NET 10.0 SDK](https://dotnet.microsoft.com/download)
- [SQL Server 2022](https://www.microsoft.com/fr-fr/sql-server)
- [Node.js](https://nodejs.org/) (pour le frontend)
- Un compte Google avec accès à **Google Cloud Console**

---

## Structure du Projet

PreparationApp/
├── backend/       # Backend (ASP.NET Core)  Voir BACKEND.md
└── frontend/      # Frontend (React + TypeScript + Vite)  FRONTEND.md

---
## Prérequis
- [.NET 10.0 SDK](https://dotnet.microsoft.com/download)
- [SQL Server 2022](https://www.microsoft.com/fr-fr/sql-server)
- [Node.js](https://nodejs.org/) (pour le frontend)
- Un compte Google avec accès à [Google Cloud Console](https://console.cloud.google.com/)

---
## Liens Utiles
- [Documentation Backend](./backend_PreparationApp/BACKEND.md)
- [Documentation Frontend](./frontend_PreparationApp/FRONTEND.md)
<<<<<<< HEAD
- [Swagger UI (Développement)](http://localhost:5000/swagger)
=======
- [Swagger UI (Développement)](http://localhost:5000/swagger)
>>>>>>> 42578a516e2f8ba52f393145f876c579e920738c
