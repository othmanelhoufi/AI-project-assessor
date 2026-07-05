# Live Demo Cheatsheet — French Insurance Scenarios

Use this guide during your live presentation. It contains the exact form selections and project descriptions to copy-paste into the AI Project Assessor tool to reproduce the 3 scenarios.

---

## Use Case 1: Customer Retention (Churn Prediction)

**Project Description (copy/paste into the text area):**
> Nous souhaitons développer un modèle de machine learning pour analyser nos données CRM et l'historique des sinistres afin de prédire quels assurés sont les plus susceptibles de résilier leur contrat. L'objectif est d'identifier ces clients à risque pour leur proposer des offres de rétention ciblées de manière proactive. L'explicabilité est cruciale pour que nos agents puissent comprendre pourquoi une recommandation de rétention est déclenchée.

**Form Selections:**
- **Primary problem**: Classify/categorize items (Classification)
- **Project scope**: Minimum Viable Product (MVP)
- **Data type**: Structured data (databases, spreadsheets, CSV files)
- **Data labeled**: Yes, fully labeled and ready for supervised learning.
- **Data volume**: Large (e.g., 100k+ records or 50-500 GB)
- **Data freshness**: Weekly or Monthly
- **Sensitive data (PII)**: Yes
- **Accuracy required**: High (e.g., >95%, customer-facing)
- **Explainability**: Critical (for regulatory compliance or user trust)
- **Multi-lingual**: No, single language and region
- **Operational uptime**: Standard Business Hours
- **Primary KPI**: Increase Revenue (e.g., new product features)
- **Budget**: $50,000 - $200,000
- **Team expertise**: Some experience with basic analytics
- **Maintenance**: The model will be static and rarely updated
- **Error impact**: Moderate impact, manageable (e.g., internal workflow disruption)
- **Error type bias**: False Negatives are worse (e.g., missing a disease, a critical threat)
- **Regulatory**: Yes, strict regulations apply

---

## Use Case 2: Automated Customer Interactions (NLP + Audio)

**Project Description (copy/paste into the text area):**
> Nous voulons mettre en place un système de traitement automatisé des interactions clients pour gérer l'afflux massif de demandes. Le système devra traiter des emails, des messages via l'espace client, et transcrire/analyser des appels téléphoniques du SVI. L'objectif est de réduire les coûts opérationnels en automatisant les demandes simples et en routant intelligemment les cas complexes, avec une disponibilité 24/7 pour un support client ininterrompu.

**Form Selections:**
- **Primary problem**: Process and understand text (Natural Language Processing)
- **Project scope**: Full Production Application
- **Data type**: Mixed data types
- **Data labeled**: Partially labeled, will require some annotation effort.
- **Data volume**: Very Large (e.g., millions of records or > 500 GB)
- **Data freshness**: Real-time (< 1 minute)
- **Sensitive data (PII)**: Yes
- **Accuracy required**: High (e.g., >95%, customer-facing)
- **Explainability**: Important for diagnostics and debugging
- **Multi-lingual**: No, single language and region
- **Operational uptime**: High Availability (e.g., 99.9%+, 24/7)
- **Primary KPI**: Reduce Operational Costs (e.g., automation)
- **Budget**: Over $500,000
- **Team expertise**: Yes, experienced data science team
- **Maintenance**: The system must be designed for automated retraining
- **Error impact**: Significant business impact (e.g., customer churn, moderate financial loss)
- **Error type bias**: False Positives are worse (e.g., wrongly accusing a customer of fraud)
- **Regulatory**: Yes, strict regulations apply

---

## Use Case 3: Internal Knowledge Management (RAG)

**Project Description (copy/paste into the text area):**
> Développement d'un assistant de recherche interne (RAG) pour notre base de connaissances. Nos collaborateurs passent trop de temps à chercher des informations spécifiques dans des centaines de contrats et de politiques d'assurance en format PDF/texte. L'outil permettra d'interroger cette base documentaire interne en langage naturel pour obtenir des réponses rapides, précises et sourcées afin d'accélérer le traitement des dossiers.

**Form Selections:**
- **Primary problem**: Search and retrieve information (Information Retrieval)
- **Project scope**: Minimum Viable Product (MVP)
- **Data type**: Unstructured text (documents, emails, social media)
- **Data labeled**: Not applicable (e.g., for unsupervised learning like clustering, or rule-based systems).
- **Data volume**: Medium (e.g., 1k-100k records or 1-50 GB)
- **Data freshness**: Weekly or Monthly
- **Sensitive data (PII)**: Yes
- **Accuracy required**: Moderate (e.g., >85%, internal tool to assist users)
- **Explainability**: Important for diagnostics and debugging
- **Multi-lingual**: No, single language and region
- **Operational uptime**: Standard Business Hours
- **Primary KPI**: Improve Customer Satisfaction (e.g., personalization)
- **Budget**: $50,000 - $200,000
- **Team expertise**: Some experience with basic analytics
- **Maintenance**: The client has a dedicated MLOps team
- **Error impact**: Low impact, easily correctable
- **Error type bias**: Both are equally undesirable
- **Regulatory**: Moderate compliance or privacy needs
