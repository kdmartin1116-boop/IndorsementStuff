import React from 'react';

export const legalContent = {
    rights: {
        title: 'Know Your Rights',
        intro: 'This guide provides a general overview of fundamental legal rights and principles that every citizen should be aware of. Understanding your rights is the first step towards becoming your own legal advocate.',
        disclaimer: 'This information is for educational purposes only and does not constitute legal advice. The law is complex and varies by jurisdiction. Consult with a qualified legal professional for advice on your specific situation.',
        points: [
            {
                title: '1. The Right to Remain Silent',
                items: [
                    'You have the right to remain silent when questioned by law enforcement. You do not have to answer their questions.',
                    'You can invoke this right by saying, "I wish to remain silent."',
                ],
            },
            {
                title: '2. The Right to an Attorney',
                items: [
                    'You have the right to an attorney. If you cannot afford an attorney, one will be appointed to you in a criminal case.',
                    'You can invoke this right by saying, "I want an attorney."',
                ],
            },
            {
                title: '3. The Right to be Free from Unreasonable Searches and Seizures',
                items: [
                    'The Fourth Amendment protects you from unreasonable searches and seizures by the government.',
                    'In most cases, law enforcement must have a warrant to search your property.',
                ],
            },
            {
                title: '4. The Right to Due Process',
                items: [
                    'The Fifth and Fourteenth Amendments guarantee your right to due process of law.',
                    'This means that the government must follow fair procedures when it takes action that affects your life, liberty, or property.',
                ],
            },
            {
                title: '5. The Right to a Fair Trial',
                items: ['If you are accused of a crime, you have the right to a fair and public trial by an impartial jury.'],
            },
            {
                title: '6. The Right to Freedom of Speech',
                items: ['The First Amendment protects your right to freedom of speech, which includes the right to express your opinions and ideas without government censorship.'],
            },
        ],
        outro: 'This is not an exhaustive list of your rights. It is important to research the laws in your jurisdiction to fully understand your rights and responsibilities.',
    },
    mistakes: {
        title: 'Common Legal Mistakes to Avoid',
        intro: 'Navigating the legal system can be challenging. This guide outlines some common mistakes that people make when representing themselves, and how to avoid them.',
        disclaimer: 'This information is for educational purposes only and does not constitute legal advice. Consult with a qualified legal professional for advice on your specific situation.',
        points: [
            {
                title: '1. Talking to the Police Without an Attorney',
                items: [
                    { text: 'The Mistake:', bold: true },
                    { text: ' Many people believe that if they are innocent, they have nothing to hide and can talk to the police without an attorney. However, anything you say can be used against you in court.', bold: false },
                    { text: 'How to Avoid It:', bold: true },
                    { text: ' Always exercise your right to remain silent and your right to an attorney. Do not answer any questions from law enforcement without an attorney present.', bold: false },
                ],
            },
            {
                title: '2. Not Reading Documents Before Signing',
                items: [
                    { text: 'The Mistake:', bold: true },
                    { text: ' Signing legal documents without reading and understanding them can have serious consequences.', bold: false },
                    { text: 'How to Avoid It:', bold: true },
                    { text: ' Carefully read every document before you sign it. If you do not understand something, ask for clarification or consult with an attorney.', bold: false },
                ],
            },
            {
                title: '3. Missing Deadlines',
                items: [
                    { text: 'The Mistake:', bold: true },
                    { text: ' The legal system has strict deadlines for filing documents and taking other actions. Missing a deadline can result in your case being dismissed.', bold: false },
                    { text: 'How to Avoid It:', bold: true },
                    { text: ' Keep a calendar of all important deadlines in your case. File all documents on time.', bold: false },
                ],
            },
            {
                title: '4. Not Knowing the Rules of Evidence',
                items: [
                    { text: 'The Mistake:', bold: true },
                    { text: ' The rules of evidence govern what information can be presented in court. If you do not know the rules of evidence, you may not be able to present your case effectively.', bold: false },
                    { text: 'How to Avoid It:', bold: true },
                    { text: ' Research the rules of evidence in your jurisdiction. If you are representing yourself, you will be expected to follow the same rules as an attorney.', bold: false },
                ],
            },
            {
                title: '5. Getting Emotional in Court',
                items: [
                    { text: 'The Mistake:', bold: true },
                    { text: ' It is understandable to be emotional when dealing with a legal issue, but getting emotional in court can hurt your case. It can make you appear less credible to the judge and jury.', bold: false },
                    { text: 'How to Avoid It:', bold: true },
                    { text: ' Stay calm and professional in court. Stick to the facts of your case and avoid making personal attacks.', bold: false },
                ],
            },
            {
                title: '6. Not Being Prepared',
                items: [
                    { text: 'The Mistake:', bold: true },
                    { text: ' Failing to prepare for a hearing or trial is a recipe for disaster.', bold: false },
                    { text: 'How to Avoid It:', bold: true },
                    { text: ' Prepare a written outline of your arguments and the evidence you will present. Practice your presentation before you go to court.', bold: false },
                ],
            },
        ],
    },
    glossary: {
        title: 'Legal Terminology Glossary',
        intro: 'This glossary provides definitions for common legal terms. Understanding these terms is essential for navigating the legal system.',
        disclaimer: 'This information is for educational purposes only and does not constitute legal advice. The definitions provided here are simplified and may not capture all legal nuances. Consult with a qualified legal professional for advice on your specific situation.',
        terms: [
            { term: 'Affidavit', definition: 'A written statement made under oath.' },
            { term: 'Appeal', definition: "A request to a higher court to review a lower court's decision." },
            { term: 'Attorney', definition: 'A person who is licensed to practice law.' },
            { term: 'Civil Case', definition: 'A lawsuit that does not involve criminal charges.' },
            { term: 'Complaint', definition: "The first document filed in a lawsuit, which outlines the plaintiff's claims against the defendant." },
            { term: 'Contract', definition: 'A legally enforceable agreement between two or more parties.' },
            { term: 'Criminal Case', definition: 'A lawsuit that is brought by the government against a person who is accused of a crime.' },
            { term: 'Defendant', definition: 'The person who is being sued or accused of a crime.' },
            { term: 'Deposition', definition: 'The process of giving sworn testimony outside of court.' },
            { term: 'Discovery', definition: 'The process of gathering evidence from the opposing party in a lawsuit.' },
            { term: 'Evidence', definition: 'Information that is presented in court to prove a fact.' },
            { term: 'Felony', definition: 'A serious crime that is punishable by more than one year in prison.' },
            { term: 'Jurisdiction', definition: 'The authority of a court to hear a case.' },
            { term: 'Lawsuit', definition: 'A legal action that is brought in a court of law.' },
            { term: 'Liability', definition: "Legal responsibility for one's acts or omissions." },
            { term: 'Misdemeanor', definition: 'A less serious crime that is punishable by less than one year in jail.' },
            { term: 'Motion', definition: 'A request to the court for an order.' },
            { term: 'Plaintiff', definition: 'The person who files a lawsuit.' },
            { term: 'Plea Bargain', definition: 'An agreement between the prosecutor and the defendant in a criminal case, in which the defendant agrees to plead guilty to a lesser charge in exchange for a more lenient sentence.' },
            { term: 'Statute of Limitations', definition: 'A law that sets a deadline for filing a lawsuit.' },
            { term: 'Subpoena', definition: 'A court order that requires a person to appear in court or to produce documents.' },
            { term: 'Testimony', definition: 'Statements made under oath in a legal proceeding.' },
            { term: 'Tort', definition: 'A civil wrong that causes harm to another person.' },
            { term: 'Verdict', definition: 'The decision of a jury in a trial.' },
        ],
    },
};
