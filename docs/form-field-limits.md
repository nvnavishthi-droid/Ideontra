# Form field limits

Persisted limits are centralized in src/lib/form-field-limits.ts and enforced
by database CHECKs/triggers: title 100; profile name 100; idea text 5000;
combined supporting links 2000; comment/progress/reason/outcome 2000; demo URL
2000. Drafts may omit mandatory content; submission enforces completeness.
Email 254/password 128 are Auth form UX caps; Supabase Auth additionally applies
its provider validation. Passwords are never persisted in public tables.
Supporting links use one HTTP(S) URL per line, validated before save and in DB.

## Idea chat — 2026-11-06

Question: 4000 characters (`fieldLimits.chatQuestion`); assistant answer: 16000
(`fieldLimits.chatAnswer`). Both mirror idea_chat_messages CHECK constraints.
Chat questions are free text; name/numeric filtering does not apply.
