./src/app/\_components/FlowingNotesContent/index.tsx
168:9 Warning: '\_handleCloseEditor' is assigned a value but never used. @typescript-eslint/no-unused-vars
175:9 Warning: '\_isEditingAnyNote' is assigned a value but never used. @typescript-eslint/no-unused-vars
181:10 Warning: '\_saveFunction' is assigned a value but never used. @typescript-eslint/no-unused-vars

./src/app/auth/signin/page.tsx
86:14 Warning: 'error' is defined but never used. @typescript-eslint/no-unused-vars
114:14 Warning: 'error' is defined but never used. @typescript-eslint/no-unused-vars
242:16 Error: `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`. react/no-unescaped-entities

./src/app/auth/signup/page.tsx
80:13 Error: Unsafe assignment of an `any` value. @typescript-eslint/no-unsafe-assignment
83:18 Error: Unsafe argument of type `any` assigned to a parameter of type `SetStateAction<string | null>`. @typescript-eslint/no-unsafe-argument
83:23 Error: Unsafe member access .error on an `any` value. @typescript-eslint/no-unsafe-member-access
88:14 Warning: 'error' is defined but never used. @typescript-eslint/no-unused-vars

./src/app/settings/calendars/page.tsx
23:9 Warning: 'router' is assigned a value but never used. @typescript-eslint/no-unused-vars

./src/app/transcription/page.tsx
30:43 Error: `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`. react/no-unescaped-entities
30:61 Error: `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`. react/no-unescaped-entities

./src/app/webspeech/page.tsx
30:20 Error: Unexpected any. Specify a different type. @typescript-eslint/no-explicit-any
35:3 Error: Interface only has a call signature, you should use a function type instead. @typescript-eslint/prefer-function-type
78:15 Error: Prefer using an optional chain expression instead, as it's more concise and easier to read. @typescript-eslint/prefer-optional-chain
96:48 Error: Unexpected any. Specify a different type. @typescript-eslint/no-explicit-any
98:23 Error: Unsafe member access .error on an `any` value. @typescript-eslint/no-unsafe-member-access
126:50 Error: Unsafe member access .error on an `any` value. @typescript-eslint/no-unsafe-member-access
135:57 Error: Unsafe member access .error on an `any` value. @typescript-eslint/no-unsafe-member-access
183:31 Error: `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`. react/no-unescaped-entities

./src/components/editor/BlockNoteEditor.tsx
3:10 Warning: 'useState' is defined but never used. @typescript-eslint/no-unused-vars
3:44 Warning: 'useRef' is defined but never used. @typescript-eslint/no-unused-vars
34:3 Warning: 'placeholder' is assigned a value but never used. Allowed unused args must match /^\_/u. @typescript-eslint/no-unused-vars

./src/components/editor/DayNoteEditor.tsx
63:7 Error: Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator. @typescript-eslint/no-floating-promises
95:14 Error: Expected the Promise rejection reason to be an Error. @typescript-eslint/prefer-promise-reject-errors
151:6 Warning: React Hook useEffect has a missing dependency: 'handleSave'. Either include it or remove the dependency array. react-hooks/exhaustive-deps

./src/components/editor/EnhancedNoteEditor.tsx
32:10 Warning: 'isSaving' is assigned a value but never used. @typescript-eslint/no-unused-vars
76:9 Error: Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator. @typescript-eslint/no-floating-promises
81:27 Error: Use a ! assertion to more succinctly remove null and undefined from the type. @typescript-eslint/non-nullable-type-assertion-style
92:9 Error: Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator. @typescript-eslint/no-floating-promises
104:9 Error: Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator. @typescript-eslint/no-floating-promises
110:17 Error: Use a ! assertion to more succinctly remove null and undefined from the type. @typescript-eslint/non-nullable-type-assertion-style
116:9 Error: Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator. @typescript-eslint/no-floating-promises
157:9 Error: Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator. @typescript-eslint/no-floating-promises
183:26 Error: Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator. @typescript-eslint/no-floating-promises

./src/components/editor/MeetingNoteEditor.tsx
4:10 Warning: 'toast' is defined but never used. @typescript-eslint/no-unused-vars
58:7 Error: Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator. @typescript-eslint/no-floating-promises
89:14 Error: Expected the Promise rejection reason to be an Error. @typescript-eslint/prefer-promise-reject-errors
104:6 Warning: React Hook useEffect has a missing dependency: 'handleSave'. Either include it or remove the dependency array. react-hooks/exhaustive-deps
123:7 Error: Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator. @typescript-eslint/no-floating-promises

./src/components/features/video-call-transcription.tsx
10:5 Error: Prefer using an optional chain expression instead, as it's more concise and easier to read. @typescript-eslint/prefer-optional-chain
18:10 Error: Unsafe array destructuring of a tuple element with an `any` value. @typescript-eslint/no-unsafe-assignment
18:50 Error: Unexpected any. Specify a different type. @typescript-eslint/no-explicit-any
58:57 Error: Unexpected any. Specify a different type. @typescript-eslint/no-explicit-any
80:7 Error: Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator. @typescript-eslint/no-floating-promises
88:6 Warning: React Hook useEffect has a missing dependency: 'stopScreenCapture'. Either include it or remove the dependency array. react-hooks/exhaustive-deps
201:11 Error: Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator. @typescript-eslint/no-floating-promises
217:11 Error: Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator. @typescript-eslint/no-floating-promises
264:46 Error: Promise returned in function argument where a void return was expected. @typescript-eslint/no-misused-promises
281:11 Error: Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator. @typescript-eslint/no-floating-promises
292:9 Error: Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator. @typescript-eslint/no-floating-promises
297:9 Error: Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator. @typescript-eslint/no-floating-promises
359:60 Error: Unsafe member access .constructor on an `any` value. @typescript-eslint/no-unsafe-member-access
365:51 Error: Unexpected any. Specify a different type. @typescript-eslint/no-explicit-any
373:34 Error: This assertion is unnecessary since it does not change the type of the expression. @typescript-eslint/no-unnecessary-type-assertion
373:49 Error: Unexpected any. Specify a different type. @typescript-eslint/no-explicit-any
373:54 Error: Unsafe member access .**call** on an `any` value. @typescript-eslint/no-unsafe-member-access
374:9 Error: Unsafe assignment of an `any` value. @typescript-eslint/no-unsafe-assignment
374:24 Error: Unsafe call of a(n) `any` typed value. @typescript-eslint/no-unsafe-call
374:25 Error: This assertion is unnecessary since it does not change the type of the expression. @typescript-eslint/no-unnecessary-type-assertion
374:40 Error: Unexpected any. Specify a different type. @typescript-eslint/no-explicit-any
374:45 Error: Unsafe member access .**call** on an `any` value. @typescript-eslint/no-unsafe-member-access
378:9 Error: Unsafe assignment of an `any` value. @typescript-eslint/no-unsafe-assignment
378:24 Error: Unsafe call of a(n) `any` typed value. @typescript-eslint/no-unsafe-call
385:19 Error: This assertion is unnecessary since it does not change the type of the expression. @typescript-eslint/no-unnecessary-type-assertion
385:34 Error: Unexpected any. Specify a different type. @typescript-eslint/no-explicit-any
385:39 Error: Unsafe member access .generate on an `any` value. @typescript-eslint/no-unsafe-member-access
387:11 Error: Unsafe assignment of an `any` value. @typescript-eslint/no-unsafe-assignment
387:26 Error: Unsafe call of a(n) `any` typed value. @typescript-eslint/no-unsafe-call
387:27 Error: This assertion is unnecessary since it does not change the type of the expression. @typescript-eslint/no-unnecessary-type-assertion
387:42 Error: Unexpected any. Specify a different type. @typescript-eslint/no-explicit-any
387:47 Error: Unsafe member access .generate on an `any` value. @typescript-eslint/no-unsafe-member-access
390:19 Error: This assertion is unnecessary since it does not change the type of the expression. @typescript-eslint/no-unnecessary-type-assertion
390:34 Error: Unexpected any. Specify a different type. @typescript-eslint/no-explicit-any
390:39 Error: Unsafe member access .process on an `any` value. @typescript-eslint/no-unsafe-member-access
392:11 Error: Unsafe assignment of an `any` value. @typescript-eslint/no-unsafe-assignment
392:26 Error: Unsafe call of a(n) `any` typed value. @typescript-eslint/no-unsafe-call
392:27 Error: This assertion is unnecessary since it does not change the type of the expression. @typescript-eslint/no-unnecessary-type-assertion
392:42 Error: Unexpected any. Specify a different type. @typescript-eslint/no-explicit-any
392:47 Error: Unsafe member access .process on an `any` value. @typescript-eslint/no-unsafe-member-access
395:19 Error: This assertion is unnecessary since it does not change the type of the expression. @typescript-eslint/no-unnecessary-type-assertion
395:34 Error: Unexpected any. Specify a different type. @typescript-eslint/no-explicit-any
395:39 Error: Unsafe member access .transcribe on an `any` value. @typescript-eslint/no-unsafe-member-access
397:11 Error: Unsafe assignment of an `any` value. @typescript-eslint/no-unsafe-assignment
397:26 Error: Unsafe call of a(n) `any` typed value. @typescript-eslint/no-unsafe-call
397:27 Error: This assertion is unnecessary since it does not change the type of the expression. @typescript-eslint/no-unnecessary-type-assertion
397:42 Error: Unexpected any. Specify a different type. @typescript-eslint/no-explicit-any
397:47 Error: Unsafe member access .transcribe on an `any` value. @typescript-eslint/no-unsafe-member-access
400:19 Error: This assertion is unnecessary since it does not change the type of the expression. @typescript-eslint/no-unnecessary-type-assertion
400:34 Error: Unexpected any. Specify a different type. @typescript-eslint/no-explicit-any
400:39 Error: Unsafe member access .call on an `any` value. @typescript-eslint/no-unsafe-member-access
402:11 Error: Unsafe assignment of an `any` value. @typescript-eslint/no-unsafe-assignment
402:26 Error: Unsafe call of a(n) `any` typed value. @typescript-eslint/no-unsafe-call
402:27 Error: This assertion is unnecessary since it does not change the type of the expression. @typescript-eslint/no-unnecessary-type-assertion
402:42 Error: Unexpected any. Specify a different type. @typescript-eslint/no-explicit-any
402:47 Error: Unsafe member access .call on an `any` value. @typescript-eslint/no-unsafe-member-access
419:39 Error: Unexpected any. Specify a different type. @typescript-eslint/no-explicit-any
419:44 Error: Unsafe member access .call on an `any` value. @typescript-eslint/no-unsafe-member-access
421:15 Error: Unsafe assignment of an `any` value. @typescript-eslint/no-unsafe-assignment
421:30 Error: Unsafe call of a(n) `any` typed value. @typescript-eslint/no-unsafe-call
421:47 Error: Unexpected any. Specify a different type. @typescript-eslint/no-explicit-any
421:52 Error: Unsafe member access .call on an `any` value. @typescript-eslint/no-unsafe-member-access
433:35 Error: Unsafe member access .text on an `any` value. @typescript-eslint/no-unsafe-member-access
434:26 Error: Unsafe argument of type `any` assigned to a parameter of type `SetStateAction<string>`. @typescript-eslint/no-unsafe-argument
434:33 Error: Unsafe member access .text on an `any` value. @typescript-eslint/no-unsafe-member-access
437:48 Error: Unsafe return of a value of type `any`. @typescript-eslint/no-unsafe-return
437:54 Error: Unsafe member access .text on an `any` value. @typescript-eslint/no-unsafe-member-access

./src/components/notes/NoteItem.tsx
26:3 Warning: 'id' is defined but never used. Allowed unused args must match /^\_/u. @typescript-eslint/no-unused-vars

./src/components/notes/TimelineMeetingItem.tsx
3:31 Warning: 'useRef' is defined but never used. @typescript-eslint/no-unused-vars
15:3 Warning: 'Save' is defined but never used. @typescript-eslint/no-unused-vars
80:10 Warning: 'isToday' is assigned a value but never used. @typescript-eslint/no-unused-vars
99:7 Error: Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator. @typescript-eslint/no-floating-promises
100:7 Error: Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator. @typescript-eslint/no-floating-promises
114:7 Error: Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator. @typescript-eslint/no-floating-promises
128:7 Error: Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator. @typescript-eslint/no-floating-promises
153:9 Error: Unsafe assignment of an `any` value. @typescript-eslint/no-unsafe-assignment
154:7 Error: Unsafe call of a(n) `any` typed value. @typescript-eslint/no-unsafe-call
154:29 Error: Unsafe member access .map on an `any` value. @typescript-eslint/no-unsafe-member-access
154:44 Error: Unexpected any. Specify a different type. @typescript-eslint/no-explicit-any
154:52 Error: Unsafe return of a value of type `any`. @typescript-eslint/no-unsafe-return
154:61 Error: Unsafe member access .email on an `any` value. @typescript-eslint/no-unsafe-member-access
320:14 Error: Expected the Promise rejection reason to be an Error. @typescript-eslint/prefer-promise-reject-errors
348:6 Warning: React Hook useEffect has a missing dependency: 'handleSaveNote'. Either include it or remove the dependency array. react-hooks/exhaustive-deps
424:11 Error: Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator. @typescript-eslint/no-floating-promises
444:5 Error: Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator. @typescript-eslint/no-floating-promises
446:5 Error: Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator. @typescript-eslint/no-floating-promises
547:27 Error: Unsafe member access .length on an `any` value. @typescript-eslint/no-unsafe-member-access
550:40 Error: Unsafe argument of type `any` assigned to a parameter of type `string[]`. @typescript-eslint/no-unsafe-argument
733:23 Error: `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`. react/no-unescaped-entities
733:35 Error: `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`. react/no-unescaped-entities
757:39 Error: `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`. react/no-unescaped-entities
757:51 Error: `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`. react/no-unescaped-entities

./src/components/notes/TimelineNoteItem.tsx
3:31 Warning: 'useRef' is defined but never used. @typescript-eslint/no-unused-vars
60:5 Error: Unsafe assignment of an `any` value. @typescript-eslint/no-unsafe-assignment
62:9 Error: Unsafe return of a value of type `any`. @typescript-eslint/no-unsafe-return
85:7 Error: Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator. @typescript-eslint/no-floating-promises
101:7 Error: Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator. @typescript-eslint/no-floating-promises
145:14 Error: Expected the Promise rejection reason to be an Error. @typescript-eslint/prefer-promise-reject-errors
161:6 Warning: React Hook useEffect has a missing dependency: 'handleSaveExistingNote'. Either include it or remove the dependency array. react-hooks/exhaustive-deps

./src/components/notes/TimelineView.tsx
76:3 Warning: 'saveInProgress' is assigned a value but never used. Allowed unused args must match /^\_/u. @typescript-eslint/no-unused-vars
141:7 Error: Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator. @typescript-eslint/no-floating-promises
182:14 Error: Expected the Promise rejection reason to be an Error. @typescript-eslint/prefer-promise-reject-errors
198:9 Warning: 'handleCancelNewNote' is assigned a value but never used. @typescript-eslint/no-unused-vars
215:6 Warning: React Hook useEffect has a missing dependency: 'handleSaveNewNote'. Either include it or remove the dependency array. react-hooks/exhaustive-deps

./src/components/ui/form.tsx
4:1 Warning: All imports in the declaration are only used as types. Use `import type`. @typescript-eslint/consistent-type-imports

./src/components/ui/meeting-transcription.tsx
22:65 Error: Unexpected any. Specify a different type. @typescript-eslint/no-explicit-any
25:70 Error: Unexpected any. Specify a different type. @typescript-eslint/no-explicit-any
27:51 Error: Unexpected any. Specify a different type. @typescript-eslint/no-explicit-any
49:10 Error: Unsafe array destructuring of a tuple element with an `any` value. @typescript-eslint/no-unsafe-assignment
49:50 Error: Unexpected any. Specify a different type. @typescript-eslint/no-explicit-any
66:5 Error: Use `String#includes()` method with a string instead. @typescript-eslint/prefer-includes
67:8 Error: Use `String#includes()` method with a string instead. @typescript-eslint/prefer-includes
67:46 Error: Use `String#includes()` method with a string instead. @typescript-eslint/prefer-includes
116:42 Error: Unexpected any. Specify a different type. @typescript-eslint/no-explicit-any
116:47 Error: Unsafe member access .**call** on an `any` value. @typescript-eslint/no-unsafe-member-access
118:38 Error: Unexpected any. Specify a different type. @typescript-eslint/no-explicit-any
119:17 Error: Unsafe return of a value of type `any`. @typescript-eslint/no-unsafe-return
119:17 Error: Unsafe call of a(n) `any` typed value. @typescript-eslint/no-unsafe-call
119:37 Error: Unexpected any. Specify a different type. @typescript-eslint/no-explicit-any
119:42 Error: Unsafe member access .**call** on an `any` value. @typescript-eslint/no-unsafe-member-access
123:42 Error: Unexpected any. Specify a different type. @typescript-eslint/no-explicit-any
123:47 Error: Unsafe member access .call on an `any` value. @typescript-eslint/no-unsafe-member-access
125:38 Error: Unexpected any. Specify a different type. @typescript-eslint/no-explicit-any
126:17 Error: Unsafe return of a value of type `any`. @typescript-eslint/no-unsafe-return
126:17 Error: Unsafe call of a(n) `any` typed value. @typescript-eslint/no-unsafe-call
126:37 Error: Unexpected any. Specify a different type. @typescript-eslint/no-explicit-any
126:42 Error: Unsafe member access .call on an `any` value. @typescript-eslint/no-unsafe-member-access
167:42 Error: Unexpected any. Specify a different type. @typescript-eslint/no-explicit-any
167:47 Error: Unsafe member access .**call** on an `any` value. @typescript-eslint/no-unsafe-member-access
169:38 Error: Unexpected any. Specify a different type. @typescript-eslint/no-explicit-any
170:17 Error: Unsafe return of a value of type `any`. @typescript-eslint/no-unsafe-return
170:17 Error: Unsafe call of a(n) `any` typed value. @typescript-eslint/no-unsafe-call
170:37 Error: Unexpected any. Specify a different type. @typescript-eslint/no-explicit-any
170:42 Error: Unsafe member access .**call** on an `any` value. @typescript-eslint/no-unsafe-member-access
174:42 Error: Unexpected any. Specify a different type. @typescript-eslint/no-explicit-any
174:47 Error: Unsafe member access .call on an `any` value. @typescript-eslint/no-unsafe-member-access
176:38 Error: Unexpected any. Specify a different type. @typescript-eslint/no-explicit-any
177:17 Error: Unsafe return of a value of type `any`. @typescript-eslint/no-unsafe-return
177:17 Error: Unsafe call of a(n) `any` typed value. @typescript-eslint/no-unsafe-call
177:37 Error: Unexpected any. Specify a different type. @typescript-eslint/no-explicit-any
177:42 Error: Unsafe member access .call on an `any` value. @typescript-eslint/no-unsafe-member-access
208:5 Error: Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator. @typescript-eslint/no-floating-promises
441:11 Error: 'testStartTime' is never reassigned. Use 'const' instead. prefer-const
555:7 Error: Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator. @typescript-eslint/no-floating-promises
589:11 Warning: 'existingText' is assigned a value but never used. @typescript-eslint/no-unused-vars
615:38 Error: Unexpected any. Specify a different type. @typescript-eslint/no-explicit-any
615:43 Error: Unsafe member access .**call** on an `any` value. @typescript-eslint/no-unsafe-member-access
617:34 Error: Unexpected any. Specify a different type. @typescript-eslint/no-explicit-any
618:13 Error: Unsafe return of a value of type `any`. @typescript-eslint/no-unsafe-return
618:13 Error: Unsafe call of a(n) `any` typed value. @typescript-eslint/no-unsafe-call
618:33 Error: Unexpected any. Specify a different type. @typescript-eslint/no-explicit-any
618:38 Error: Unsafe member access .**call** on an `any` value. @typescript-eslint/no-unsafe-member-access
622:38 Error: Unexpected any. Specify a different type. @typescript-eslint/no-explicit-any
622:43 Error: Unsafe member access .call on an `any` value. @typescript-eslint/no-unsafe-member-access
624:34 Error: Unexpected any. Specify a different type. @typescript-eslint/no-explicit-any
624:42 Error: Unsafe return of a value of type `any`. @typescript-eslint/no-unsafe-return
624:42 Error: Unsafe call of a(n) `any` typed value. @typescript-eslint/no-unsafe-call
624:62 Error: Unexpected any. Specify a different type. @typescript-eslint/no-explicit-any
624:67 Error: Unsafe member access .call on an `any` value. @typescript-eslint/no-unsafe-member-access
667:7 Error: Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator. @typescript-eslint/no-floating-promises
698:33 Error: This assertion is unnecessary since it does not change the type of the expression. @typescript-eslint/no-unnecessary-type-assertion
703:49 Error: This assertion is unnecessary since it does not change the type of the expression. @typescript-eslint/no-unnecessary-type-assertion
719:13 Error: Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator. @typescript-eslint/no-floating-promises
739:37 Error: This assertion is unnecessary since it does not change the type of the expression. @typescript-eslint/no-unnecessary-type-assertion
763:11 Error: Unsafe assignment of an `any` value. @typescript-eslint/no-unsafe-assignment
764:18 Error: Unexpected any. Specify a different type. @typescript-eslint/no-explicit-any
764:23 Error: Unsafe member access .SpeechRecognition on an `any` value. @typescript-eslint/no-unsafe-member-access
765:18 Error: Unexpected any. Specify a different type. @typescript-eslint/no-explicit-any
765:23 Error: Unsafe member access .webkitSpeechRecognition on an `any` value. @typescript-eslint/no-unsafe-member-access
766:18 Error: Unexpected any. Specify a different type. @typescript-eslint/no-explicit-any
766:23 Error: Unsafe member access .mozSpeechRecognition on an `any` value. @typescript-eslint/no-unsafe-member-access
767:18 Error: Unexpected any. Specify a different type. @typescript-eslint/no-explicit-any
767:23 Error: Unsafe member access .msSpeechRecognition on an `any` value. @typescript-eslint/no-unsafe-member-access
774:11 Error: Unsafe assignment of an `any` value. @typescript-eslint/no-unsafe-assignment
774:25 Error: Unsafe construction of a(n) `any` typed value. @typescript-eslint/no-unsafe-call
779:19 Error: Unsafe member access .continuous on an `any` value. @typescript-eslint/no-unsafe-member-access
780:19 Error: Unsafe member access .interimResults on an `any` value. @typescript-eslint/no-unsafe-member-access
781:19 Error: Unsafe member access .maxAlternatives on an `any` value. @typescript-eslint/no-unsafe-member-access
784:19 Error: Unsafe member access .lang on an `any` value. @typescript-eslint/no-unsafe-member-access
788:10 Error: This assertion is unnecessary since it does not change the type of the expression. @typescript-eslint/no-unnecessary-type-assertion
788:25 Error: Unexpected any. Specify a different type. @typescript-eslint/no-explicit-any
788:30 Error: Unsafe member access .interimResultsTimeout on an `any` value. @typescript-eslint/no-unsafe-member-access
794:19 Error: Unsafe member access .continuous on an `any` value. @typescript-eslint/no-unsafe-member-access
795:19 Error: Unsafe member access .interimResults on an `any` value. @typescript-eslint/no-unsafe-member-access
796:19 Error: Unsafe member access .maxAlternatives on an `any` value. @typescript-eslint/no-unsafe-member-access
797:19 Error: Unsafe member access .lang on an `any` value. @typescript-eslint/no-unsafe-member-access
800:5 Error: Unsafe return of a value of type `any`. @typescript-eslint/no-unsafe-return
833:7 Error: Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator. @typescript-eslint/no-floating-promises
854:11 Error: Unsafe assignment of an `any` value. @typescript-eslint/no-unsafe-assignment
859:5 Error: Unsafe assignment of an `any` value. @typescript-eslint/no-unsafe-assignment
863:17 Error: Unsafe member access .onresult on an `any` value. @typescript-eslint/no-unsafe-member-access
874:13 Error: Prefer using an optional chain expression instead, as it's more concise and easier to read. @typescript-eslint/prefer-optional-chain
882:11 Warning: 'interimTranscript' is assigned a value but never used. @typescript-eslint/no-unused-vars
902:17 Error: Unsafe member access .onerror on an `any` value. @typescript-eslint/no-unsafe-member-access
908:9 Error: Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator. @typescript-eslint/no-floating-promises
914:17 Error: Unsafe member access .onend on an `any` value. @typescript-eslint/no-unsafe-member-access
923:15 Error: Unsafe call of a(n) `any` typed value. @typescript-eslint/no-unsafe-call
923:27 Error: Unsafe member access .start on an `any` value. @typescript-eslint/no-unsafe-member-access
942:9 Error: Unsafe call of a(n) `any` typed value. @typescript-eslint/no-unsafe-call
942:21 Error: Unsafe member access .start on an `any` value. @typescript-eslint/no-unsafe-member-access
973:11 Error: Unsafe assignment of an `any` value. @typescript-eslint/no-unsafe-assignment
978:5 Error: Unsafe assignment of an `any` value. @typescript-eslint/no-unsafe-assignment
987:17 Error: Unsafe member access .onresult on an `any` value. @typescript-eslint/no-unsafe-member-access
1000:13 Error: Prefer using an optional chain expression instead, as it's more concise and easier to read. @typescript-eslint/prefer-optional-chain
1008:11 Warning: 'interimTranscript' is assigned a value but never used. @typescript-eslint/no-unused-vars
1028:17 Error: Unsafe member access .onerror on an `any` value. @typescript-eslint/no-unsafe-member-access
1038:15 Error: Unsafe call of a(n) `any` typed value. @typescript-eslint/no-unsafe-call
1038:27 Error: Unsafe member access .stop on an `any` value. @typescript-eslint/no-unsafe-member-access
1048:17 Error: Unsafe call of a(n) `any` typed value. @typescript-eslint/no-unsafe-call
1048:29 Error: Unsafe member access .start on an `any` value. @typescript-eslint/no-unsafe-member-access
1084:13 Error: Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator. @typescript-eslint/no-floating-promises
1091:17 Error: Unsafe member access .onend on an `any` value. @typescript-eslint/no-unsafe-member-access
1103:15 Error: Unsafe call of a(n) `any` typed value. @typescript-eslint/no-unsafe-call
1103:27 Error: Unsafe member access .start on an `any` value. @typescript-eslint/no-unsafe-member-access
1120:9 Error: Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator. @typescript-eslint/no-floating-promises
1125:5 Error: Unsafe call of a(n) `any` typed value. @typescript-eslint/no-unsafe-call
1125:17 Error: Unsafe member access .start on an `any` value. @typescript-eslint/no-unsafe-member-access
1209:9 Error: Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator. @typescript-eslint/no-floating-promises
1225:9 Error: Expected the Promise rejection reason to be an Error. @typescript-eslint/prefer-promise-reject-errors
1238:41 Error: Unexpected any. Specify a different type. @typescript-eslint/no-explicit-any
1238:57 Error: Unexpected any. Specify a different type. @typescript-eslint/no-explicit-any
1257:38 Error: Unexpected any. Specify a different type. @typescript-eslint/no-explicit-any
1257:43 Error: Unsafe member access .**call** on an `any` value. @typescript-eslint/no-unsafe-member-access
1259:34 Error: Unexpected any. Specify a different type. @typescript-eslint/no-explicit-any
1260:13 Error: Unsafe return of a value of type `any`. @typescript-eslint/no-unsafe-return
1260:13 Error: Unsafe call of a(n) `any` typed value. @typescript-eslint/no-unsafe-call
1260:33 Error: Unexpected any. Specify a different type. @typescript-eslint/no-explicit-any
1260:38 Error: Unsafe member access .**call** on an `any` value. @typescript-eslint/no-unsafe-member-access
1265:38 Error: Unexpected any. Specify a different type. @typescript-eslint/no-explicit-any
1265:43 Error: Unsafe member access .call on an `any` value. @typescript-eslint/no-unsafe-member-access
1267:34 Error: Unexpected any. Specify a different type. @typescript-eslint/no-explicit-any
1267:42 Error: Unsafe return of a value of type `any`. @typescript-eslint/no-unsafe-return
1267:42 Error: Unsafe call of a(n) `any` typed value. @typescript-eslint/no-unsafe-call
1267:62 Error: Unexpected any. Specify a different type. @typescript-eslint/no-explicit-any
1267:67 Error: Unsafe member access .call on an `any` value. @typescript-eslint/no-unsafe-member-access
1279:7 Error: Unsafe assignment of an `any` value. @typescript-eslint/no-unsafe-assignment
1302:9 Error: Unsafe assignment of an `any` value. @typescript-eslint/no-unsafe-assignment
1311:35 Error: Unsafe member access .text on an `any` value. @typescript-eslint/no-unsafe-member-access
1312:9 Error: Unsafe assignment of an `any` value. @typescript-eslint/no-unsafe-assignment
1312:23 Error: Unsafe member access .text on an `any` value. @typescript-eslint/no-unsafe-member-access
1314:34 Error: Unsafe return of a value of type `any`. @typescript-eslint/no-unsafe-return
1314:36 Error: Unsafe member access .text on an `any` value. @typescript-eslint/no-unsafe-member-access
1378:9 Error: Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator. @typescript-eslint/no-floating-promises
1578:43 Error: `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`. react/no-unescaped-entities
1582:42 Error: `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`. react/no-unescaped-entities
1582:48 Error: `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`. react/no-unescaped-entities
1598:24 Error: `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`. react/no-unescaped-entities
1614:19 Error: Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator. @typescript-eslint/no-floating-promises
1748:39 Error: `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`. react/no-unescaped-entities
1748:51 Error: `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`. react/no-unescaped-entities
1751:27 Error: `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`. react/no-unescaped-entities
1751:42 Error: `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`. react/no-unescaped-entities
1762:38 Error: `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`. react/no-unescaped-entities
1777:28 Error: `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`. react/no-unescaped-entities
1777:47 Error: `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`. react/no-unescaped-entities
1849:49 Error: `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`. react/no-unescaped-entities
1897:17 Error: Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator. @typescript-eslint/no-floating-promises

./src/components/ui/textarea.tsx
5:18 Error: An interface declaring no members is equivalent to its supertype. @typescript-eslint/no-empty-object-type

./src/components/ui/transcription.tsx
27:10 Error: Unsafe array destructuring of a tuple element with an `any` value. @typescript-eslint/no-unsafe-assignment
27:50 Error: Unexpected any. Specify a different type. @typescript-eslint/no-explicit-any
54:5 Error: Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator. @typescript-eslint/no-floating-promises
59:6 Warning: React Hook useEffect has a missing dependency: 'stopAllRecordings'. Either include it or remove the dependency array. react-hooks/exhaustive-deps
92:13 Error: Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator. @typescript-eslint/no-floating-promises
147:11 Error: Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator. @typescript-eslint/no-floating-promises
202:11 Error: Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator. @typescript-eslint/no-floating-promises
209:9 Error: Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator. @typescript-eslint/no-floating-promises
232:13 Error: Unsafe assignment of an `any` value. @typescript-eslint/no-unsafe-assignment
232:28 Error: Unsafe call of a(n) `any` typed value. @typescript-eslint/no-unsafe-call
233:24 Error: Unsafe argument of type `any` assigned to a parameter of type `SetStateAction<string>`. @typescript-eslint/no-unsafe-argument
233:31 Error: Unsafe member access .text on an `any` value. @typescript-eslint/no-unsafe-member-access

./src/emails/magic-link-email.tsx
22:38 Warning: 'host' is defined but never used. Allowed unused args must match /^\_/u. @typescript-eslint/no-unused-vars

./src/emails/verification-email.tsx
24:3 Warning: 'host' is defined but never used. Allowed unused args must match /^\_/u. @typescript-eslint/no-unused-vars

./src/hooks/useDayNotes.ts
32:7 Error: Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator. @typescript-eslint/no-floating-promises
35:62 Error: 'err' will use Object's default stringification format ('[object Object]') when stringified. @typescript-eslint/no-base-to-string
48:13 Warning: 'formattedDate' is assigned a value but never used. @typescript-eslint/no-unused-vars
52:15 Error: Expected an error object to be thrown. @typescript-eslint/only-throw-error
73:17 Error: Unsafe assignment of an `any` value. @typescript-eslint/no-unsafe-assignment
78:25 Error: Unsafe member access .type on an `any` value. @typescript-eslint/no-unsafe-member-access
94:15 Warning: 'result' is assigned a value but never used. @typescript-eslint/no-unused-vars
116:15 Warning: 'formattedDate' is assigned a value but never used. @typescript-eslint/no-unused-vars

./src/hooks/useEnhancedDayNotes.ts
40:7 Error: Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator. @typescript-eslint/no-floating-promises
43:62 Error: 'err' will use Object's default stringification format ('[object Object]') when stringified. @typescript-eslint/no-base-to-string
74:5 Error: Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator. @typescript-eslint/no-floating-promises
75:6 Warning: React Hook useEffect has a missing dependency: 'getDayNoteQuery'. Either include it or remove the dependency array. react-hooks/exhaustive-deps

./src/hooks/useEnhancedMeetingNotes.ts
40:7 Error: Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator. @typescript-eslint/no-floating-promises
43:62 Error: 'err' will use Object's default stringification format ('[object Object]') when stringified. @typescript-eslint/no-base-to-string
74:5 Error: Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator. @typescript-eslint/no-floating-promises
75:6 Warning: React Hook useEffect has a missing dependency: 'getMeetingNoteQuery'. Either include it or remove the dependency array. react-hooks/exhaustive-deps

./src/hooks/useMeetingNotes.ts
34:7 Error: Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator. @typescript-eslint/no-floating-promises
37:62 Error: 'err' will use Object's default stringification format ('[object Object]') when stringified. @typescript-eslint/no-base-to-string
53:15 Error: Expected an error object to be thrown. @typescript-eslint/only-throw-error
63:6 Warning: React Hook useCallback has an unnecessary dependency: 'meetingId'. Either exclude it or remove the dependency array. react-hooks/exhaustive-deps

./src/hooks/useTodos.ts
86:7 Error: Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator. @typescript-eslint/no-floating-promises
146:7 Error: Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator. @typescript-eslint/no-floating-promises
185:7 Error: Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator. @typescript-eslint/no-floating-promises
192:37 Error: Type boolean trivially inferred from a boolean literal, remove type annotation. @typescript-eslint/no-inferrable-types

./src/server/api/routers/notes.ts
11:7 Warning: 'createDayNoteSchema' is assigned a value but never used. @typescript-eslint/no-unused-vars

./src/server/auth/config.ts
131:13 Error: Prefer using an optional chain expression instead, as it's more concise and easier to read. @typescript-eslint/prefer-optional-chain
159:38 Warning: 'email' is defined but never used. Allowed unused args must match /^_/u. @typescript-eslint/no-unused-vars
159:45 Warning: 'credentials' is defined but never used. Allowed unused args must match /^_/u. @typescript-eslint/no-unused-vars
173:55 Error: Prefer using an optional chain expression instead, as it's more concise and easier to read. @typescript-eslint/prefer-optional-chain

./src/server/services/calendar/auth-handler.ts
9:12 Error: Unexpected any. Specify a different type. @typescript-eslint/no-explicit-any
13:5 Error: Unsafe assignment of an `any` value. @typescript-eslint/no-unsafe-assignment
13:24 Error: Unsafe member access .provider on an `any` value. @typescript-eslint/no-unsafe-member-access
14:33 Error: Unsafe member access .refresh_token on an `any` value. @typescript-eslint/no-unsafe-member-access
15:32 Error: Unsafe member access .access_token on an `any` value. @typescript-eslint/no-unsafe-member-access
16:5 Error: Unsafe assignment of an `any` value. @typescript-eslint/no-unsafe-assignment
16:21 Error: Unsafe member access .scope on an `any` value. @typescript-eslint/no-unsafe-member-access
21:15 Error: Unsafe member access .provider on an `any` value. @typescript-eslint/no-unsafe-member-access
22:15 Error: Unsafe member access .refresh_token on an `any` value. @typescript-eslint/no-unsafe-member-access
23:15 Error: Unsafe member access .access_token on an `any` value. @typescript-eslint/no-unsafe-member-access
26:13 Error: Unsafe assignment of an `any` value. @typescript-eslint/no-unsafe-assignment
26:32 Error: Unsafe call of a(n) `any` typed value. @typescript-eslint/no-unsafe-call
26:40 Error: Unsafe member access .scope on an `any` value. @typescript-eslint/no-unsafe-member-access
33:19 Error: Unsafe member access .scope on an `any` value. @typescript-eslint/no-unsafe-member-access
38:13 Warning: 'googleService' is assigned a value but never used. @typescript-eslint/no-unused-vars
54:13 Error: Unsafe assignment of an `any` value. @typescript-eslint/no-unsafe-assignment
54:34 Error: Unsafe member access .access_token on an `any` value. @typescript-eslint/no-unsafe-member-access
55:13 Error: Unsafe assignment of an `any` value. @typescript-eslint/no-unsafe-assignment
55:35 Error: Unsafe member access .refresh_token on an `any` value. @typescript-eslint/no-unsafe-member-access
56:34 Error: Unsafe member access .expires_at on an `any` value. @typescript-eslint/no-unsafe-member-access
57:34 Error: Unsafe member access .expires_at on an `any` value. @typescript-eslint/no-unsafe-member-access
66:11 Error: Unsafe assignment of an `any` value. @typescript-eslint/no-unsafe-assignment
66:38 Error: Unsafe member access .providerAccountId on an `any` value. @typescript-eslint/no-unsafe-member-access
67:11 Error: Unsafe assignment of an `any` value. @typescript-eslint/no-unsafe-assignment
67:26 Error: Unsafe member access .email on an `any` value. @typescript-eslint/no-unsafe-member-access
75:13 Error: Unsafe assignment of an `any` value. @typescript-eslint/no-unsafe-assignment
75:35 Error: Unsafe member access .providerAccountId on an `any` value. @typescript-eslint/no-unsafe-member-access
76:13 Error: Unsafe assignment of an `any` value. @typescript-eslint/no-unsafe-assignment
76:35 Error: Unsafe member access .refresh_token on an `any` value. @typescript-eslint/no-unsafe-member-access
77:13 Error: Unsafe assignment of an `any` value. @typescript-eslint/no-unsafe-assignment
77:34 Error: Unsafe member access .access_token on an `any` value. @typescript-eslint/no-unsafe-member-access
78:34 Error: Unsafe member access .expires_at on an `any` value. @typescript-eslint/no-unsafe-member-access
79:34 Error: Unsafe member access .expires_at on an `any` value. @typescript-eslint/no-unsafe-member-access
94:33 Error: Unsafe member access .provider on an `any` value. @typescript-eslint/no-unsafe-member-access
95:28 Error: Unsafe member access .provider on an `any` value. @typescript-eslint/no-unsafe-member-access
96:37 Error: Unsafe member access .refresh_token on an `any` value. @typescript-eslint/no-unsafe-member-access
97:36 Error: Unsafe member access .access_token on an `any` value. @typescript-eslint/no-unsafe-member-access

info - Need to disable some ESLint rules? Learn more here: https://nextjs.org/docs/app/api-reference/config/eslint#disabling-rules
