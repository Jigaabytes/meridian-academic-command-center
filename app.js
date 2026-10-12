(() => {
  'use strict';

  const STORAGE_KEY = 'meridian.registry.v1';
  const SUBJECTS = [
    'Web Technologies',
    'Programming Fundamentals',
    'Database Systems',
    'Computer Networks',
    'Professional Communication'
  ];
  const SUBJECT_SHORT = ['Web Tech', 'Programming', 'Databases', 'Networks', 'Communication'];
  const TONES = ['', 'tone-1', 'tone-2', 'tone-3'];
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

  const seedStudents = [
    {id:'MR-26001',name:'Aanya Sharma',email:'aanya.sharma@meridian.edu',phone:'+91 98201 10481',course:'BSc Computer Science',semester:2,date:'2026-06-12',createdAt:1,marks:[91,84,78,72,88]},
    {id:'MR-26002',name:'Ishaan Mehta',email:'ishaan.mehta@meridian.edu',phone:'+91 98201 10482',course:'BSc Computer Science',semester:2,date:'2026-06-13',createdAt:2,marks:[76,82,69,74,81]},
    {id:'MR-26003',name:'Mira Desai',email:'mira.desai@meridian.edu',phone:'+91 98201 10483',course:'MCA',semester:1,date:'2026-06-15',createdAt:3,marks:[88,93,85,79,91]},
    {id:'MR-26004',name:'Kabir Nair',email:'kabir.nair@meridian.edu',phone:'+91 98201 10484',course:'BCA',semester:3,date:'2026-06-17',createdAt:4,marks:[62,58,64,49,71]},
    {id:'MR-26005',name:'Anaya Patel',email:'anaya.patel@meridian.edu',phone:'+91 98201 10485',course:'BBA',semester:2,date:'2026-06-18',createdAt:5,marks:[83,77,86,80,89]},
    {id:'MR-26006',name:'Reyansh Shah',email:'reyansh.shah@meridian.edu',phone:'+91 98201 10486',course:'BSc Computer Science',semester:4,date:'2026-06-20',createdAt:6,marks:[39,48,35,52,41]},
    {id:'MR-26007',name:'Sara Fernandes',email:'sara.fernandes@meridian.edu',phone:'+91 98201 10487',course:'MCA',semester:2,date:'2026-06-21',createdAt:7,marks:[73,88,81,77,86]},
    {id:'MR-26008',name:'Dev Malhotra',email:'dev.malhotra@meridian.edu',phone:'+91 98201 10488',course:'BCom',semester:1,date:'2026-06-22',createdAt:8,marks:[69,71,66,63,74]}
  ];

  let students = loadStudents();
  let currentView = 'overview';
  let selectedStudentId = students[0]?.id || null;
  let activeResultId = students[0]?.id || null;
  let modalMode = 'add';
  let toastTimer = null;

  function loadStudents() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return structuredClone(seedStudents);
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return structuredClone(seedStudents);
      return parsed.map(s => ({...s, marks: normalizeMarks(s.marks)}));
    } catch (error) {
      console.warn('Could not read local registry. Starting with demo records.', error);
      return structuredClone(seedStudents);
    }
  }

  function normalizeMarks(marks) {
    if (!Array.isArray(marks)) return Array(SUBJECTS.length).fill(null);
    return SUBJECTS.map((_, index) => {
      const value = marks[index];
      if (value === '' || value === null || value === undefined || !Number.isFinite(Number(value))) return null;
      return Math.min(100, Math.max(0, Number(value)));
    });
  }

  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
      return true;
    } catch (error) {
      showToast('Could not save to this browser. Export a backup.', 'error');
      console.error(error);
      return false;
    }
  }

  function esc(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  }
  function initials(name) { return String(name || '?').trim().split(/\s+/).slice(0,2).map(part => part[0] || '').join('').toUpperCase(); }
  function toneFor(name) { const n = String(name || '').charCodeAt(0) || 0; return TONES[n % TONES.length]; }
  function hasResults(student) { return normalizeMarks(student?.marks).some(mark => mark !== null); }
  function calc(student) {
    const marks = normalizeMarks(student?.marks);
    const valid = marks.filter(mark => mark !== null);
    const total = valid.reduce((sum, mark) => sum + mark, 0);
    const average = valid.length ? total / valid.length : 0;
    const complete = valid.length === SUBJECTS.length;
    const passed = complete && marks.every(mark => mark >= 40);
    return {marks,validCount:valid.length,total,average,percent:complete ? Math.round(average) : (valid.length ? Math.round(average) : 0),grade:gradeFor(average, valid.length),passed,complete};
  }
  function gradeFor(average, count) {
    if (!count) return '—';
    if (average >= 80) return 'A';
    if (average >= 70) return 'B';
    if (average >= 60) return 'C';
    if (average >= 40) return 'D';
    return 'F';
  }
  function statusFor(student) {
    const result = calc(student);
    if (!result.validCount) return {label:'NO RESULTS',cls:'no-result'};
    if (!result.complete) return {label:'IN PROGRESS',cls:'review'};
    if (result.passed) return {label:'ON TRACK',cls:'passed'};
    return {label:'REVIEW',cls:'review'};
  }
  function fmtAverage(value) { return Number.isInteger(value) ? String(value) : value.toFixed(1); }
  function countLabel(number, singular, plural = `${singular}s`) { return `${number} ${number === 1 ? singular : plural}`; }
  function addStudentNumber() {
    const maxNumber = students.reduce((max, item) => {
      const found = Number(String(item.id).match(/(\d+)$/)?.[1] || 0);
      return Math.max(max, found);
    }, 26000);
    return `MR-${String(maxNumber + 1).padStart(5,'0')}`;
  }
  function initialsHTML(name, extraClass = '') { return `<span class="student-avatar ${toneFor(name)} ${extraClass}">${esc(initials(name))}</span>`; }

  function metrics() {
    const resultStudents = students.filter(hasResults);
    const fullResults = students.filter(s => calc(s).complete);
    const passes = fullResults.filter(s => calc(s).passed);
    const classAverage = resultStudents.length ? resultStudents.reduce((sum,s) => sum + calc(s).average, 0) / resultStudents.length : 0;
    return {total:students.length,withResults:resultStudents.length,fullResults:fullResults.length,passes:passes.length,review:fullResults.length-passes.length,classAverage,passRate:fullResults.length ? Math.round(passes.length/fullResults.length*100) : 0};
  }

  function switchView(view) {
    const safeView = ['overview','students','results','analytics'].includes(view) ? view : 'overview';
    currentView = safeView;
    $$('.view').forEach(node => node.classList.toggle('active', node.id === `view-${safeView}`));
    $$('.nav-item').forEach(node => node.classList.toggle('active', node.dataset.view === safeView));
    $('#breadcrumbCurrent').textContent = ({overview:'Overview',students:'Student registry',results:'Results lab',analytics:'Performance'})[safeView];
    $('#sidebar').classList.remove('open');
    if (safeView === 'overview') renderOverview();
    if (safeView === 'students') renderStudents();
    if (safeView === 'results') renderResultsView();
    if (safeView === 'analytics') renderAnalytics();
    $('#pageContent').focus({preventScroll:true});
    window.scrollTo({top:0,behavior:'smooth'});
  }

  function renderOverview() {
    const m = metrics();
    $('#heroStudentCount').textContent = `${String(m.total).padStart(2,'0')} STUDENTS`;
    $('#heroAverage').innerHTML = `${Math.round(m.classAverage)}<span>%</span>`;
    $('#scoreRing').style.setProperty('--score', `${Math.round(m.classAverage)}%`);
    const metricsData = [
      {label:'Registered students',value:m.total,note:'Across all programmes',icon:'▤',accent:''},
      {label:'Results recorded',value:m.withResults,note:`of ${m.total} student records`,icon:'⌁'},
      {label:'Class average',value:`${Math.round(m.classAverage)}%`,note:'Mean of available marks',icon:'↗'},
      {label:'Needs attention',value:m.review,note:m.review ? 'Review subject-level results' : 'No completed results flagged',icon:'✳'}
    ];
    $('#overviewMetrics').innerHTML = metricsData.map((item,index) => `<article class="metric"><div class="metric-top"><span class="metric-label">${item.label}</span><span class="metric-icon">${item.icon}</span></div><div class="metric-number">${item.value}</div><div class="metric-note">${index===2?'<span class="up">↗</span>':''}${item.note}</div></article>`).join('');
    const recent = [...students].sort((a,b) => Number(b.createdAt||0)-Number(a.createdAt||0)).slice(0,4);
    $('#recentStudents').innerHTML = recent.length ? recent.map(s => {
      const r=calc(s); return `<div class="recent-item" role="button" tabindex="0" data-open-student="${esc(s.id)}"><span class="student-avatar ${toneFor(s.name)}">${esc(initials(s.name))}</span><div class="recent-info"><span class="recent-name">${esc(s.name)}</span><span class="recent-meta">${esc(s.course)} · Sem ${esc(s.semester)}</span></div><div class="recent-grade"><strong>${r.validCount ? `${r.percent}%` : '—'}</strong><small>${r.grade==='—'?'NO MARKS':`GRADE ${r.grade}`}</small></div></div>`;
    }).join('') : '<div class="empty-state">No student records yet.</div>';
    $('#passRate').textContent = m.passRate;
    $('#signalGraphic')?.style.setProperty('--pass-rate', `${m.passRate}%`);
    $('#passCount').textContent = countLabel(m.passes,'student');
    $('#reviewCount').textContent = countLabel(m.review,'student');
    $('.signal-graphic').style.background = `conic-gradient(#c7f36b 0 ${m.passRate}%,#f0e9d9 ${m.passRate}% 100%)`;
  }

  function renderCourseFilters() {
    const current = $('#courseFilter').value || 'all';
    const courses = [...new Set(students.map(s => s.course).filter(Boolean))].sort((a,b)=>a.localeCompare(b));
    $('#courseFilter').innerHTML = '<option value="all">All programmes</option>' + courses.map(course => `<option value="${esc(course)}">${esc(course)}</option>`).join('');
    $('#courseFilter').value = courses.includes(current) ? current : 'all';
  }

  function getFilteredStudents() {
    const query = $('#studentSearch').value.trim().toLowerCase();
    const course = $('#courseFilter').value;
    const semester = $('#semesterFilter').value;
    return students.filter(s => {
      const matchesQuery = !query || [s.name,s.id,s.email,s.course,s.phone].some(v => String(v || '').toLowerCase().includes(query));
      return matchesQuery && (course === 'all' || s.course === course) && (semester === 'all' || String(s.semester) === semester);
    }).sort((a,b)=>a.name.localeCompare(b.name));
  }

  function renderStudents() {
    renderCourseFilters();
    const filtered = getFilteredStudents();
    $('#registryCount').textContent = String(filtered.length).padStart(2,'0');
    $('#tableShowing').textContent = `Showing ${filtered.length} of ${students.length} records`;
    $('#studentTableBody').innerHTML = filtered.length ? filtered.map((s,index) => {
      const r=calc(s), status=statusFor(s), selected=s.id===selectedStudentId;
      return `<tr data-student-row="${esc(s.id)}" class="${selected?'selected':''}" tabindex="0" aria-label="Inspect ${esc(s.name)}"><td><span class="row-number">${String(index+1).padStart(2,'0')}</span></td><td><div class="table-person">${initialsHTML(s.name)}<div><strong>${esc(s.name)}</strong><small>${esc(s.id)}</small></div></div></td><td><span class="course-label">${esc(s.course)}</span></td><td><span class="semester-label">SEM ${esc(s.semester)}</span></td><td><div class="index-cell"><strong>${r.validCount?`${r.percent}%`:'—'}</strong><div class="mini-track"><span style="width:${r.percent}%"></span></div></div></td><td><span class="row-status ${status.cls}">${status.label}</span></td><td><button class="row-actions" data-row-menu="${esc(s.id)}" aria-label="Edit ${esc(s.name)}" title="Edit student">···</button></td></tr>`;
    }).join('') : `<tr><td colspan="7"><div class="empty-state"><strong>No matching records.</strong>Try changing your search or filters.</div></td></tr>`;
    const stillVisible = filtered.some(s => s.id === selectedStudentId);
    if (!stillVisible) selectedStudentId = filtered[0]?.id || null;
    $$('#studentTableBody tr[data-student-row]').forEach(row => row.classList.toggle('selected', row.dataset.studentRow === selectedStudentId));
    renderStudentDetail(selectedStudentId);
  }

  function renderStudentDetail(id) {
    const s = students.find(item => item.id === id);
    if (!s) {
      $('#studentDetail').innerHTML = `<div class="detail-empty"><div class="empty-symbol">↖</div><span class="eyebrow">RECORD INSPECTOR</span><h3>Choose a student.</h3><p>Select any record in the directory to inspect their academic profile and manage their results.</p></div>`;
      return;
    }
    const r=calc(s),status=statusFor(s);
    $('#studentDetail').innerHTML = `<div class="detail-header"><div class="detail-actions"><span class="detail-kicker">RECORD INSPECTOR / 01</span><button class="icon-button tiny" data-edit-student="${esc(s.id)}" aria-label="Edit student">↗</button></div><div class="detail-name-row"><div class="detail-big-avatar">${esc(initials(s.name))}</div><div><h3>${esc(s.name)}</h3><p>${esc(s.course)} · Semester ${esc(s.semester)}</p></div></div><span class="detail-code">${esc(s.id)} &nbsp;·&nbsp; <span class="row-status ${status.cls}">${status.label}</span></span></div><div class="detail-body"><div class="detail-stat-row"><div class="detail-stat"><span>ACADEMIC INDEX</span><strong>${r.validCount?`${r.percent}%`:'—'}</strong></div><div class="detail-stat"><span>OVERALL GRADE</span><strong>${r.grade}</strong></div></div><div class="detail-subheading"><strong>Subject snapshot</strong><span>${r.validCount}/${SUBJECTS.length} SCORED</span></div>${SUBJECTS.map((subject,index)=>{const value=r.marks[index];return `<div class="subject-result"><span>${esc(SUBJECT_SHORT[index])}</span><div class="subject-track"><span style="width:${value===null?0:value}%"></span></div><strong>${value===null?'—':value}</strong></div>`}).join('')}<div style="margin-top:20px;border-top:1px solid #edf0e9;padding-top:15px"><div class="detail-subheading"><strong>Contact details</strong><span>PROFILE</span></div><div style="font-size:10px;color:#768277;line-height:1.8;overflow-wrap:anywhere">${esc(s.email)}<br>${esc(s.phone||'No phone number added')}<br>Enrolled ${esc(formatDate(s.date))}</div></div></div><div class="detail-footer"><button class="button button-outline" data-edit-student="${esc(s.id)}">Edit profile</button><button class="button button-primary" data-edit-results="${esc(s.id)}">Manage results ↗</button></div>`;
  }

  function formatDate(value) {
    if (!value) return 'date not recorded';
    const date = new Date(`${value}T12:00:00`);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'});
  }

  function openStudentModal(mode='add', student=null) {
    modalMode = mode;
    $('#studentForm').reset();
    $('#studentFormMessage').textContent = '';
    $('#studentFormMessage').className = 'form-message';
    $('#editStudentId').value = student?.id || '';
    $('#modalTitle').innerHTML = mode==='edit' ? 'Refine the <em>record.</em>' : 'Make room for <em>one more.</em>';
    $('.modal-top .eyebrow').textContent = mode==='edit' ? 'REGISTRY / EDIT ENTRY' : 'REGISTRY / NEW ENTRY';
    $('#saveStudentButton').innerHTML = mode==='edit' ? 'Save changes <span>↗</span>' : 'Add to registry <span>↗</span>';
    if (student) {
      $('#studentName').value = student.name || '';
      $('#studentEmail').value = student.email || '';
      $('#studentCourse').value = student.course || '';
      $('#studentSemester').value = String(student.semester || '');
      $('#studentPhone').value = student.phone || '';
      $('#studentDate').value = student.date || '';
    } else {
      $('#studentDate').value = new Date().toISOString().slice(0,10);
    }
    $('#studentModal').classList.add('open');
    $('#studentModal').setAttribute('aria-hidden','false');
    setTimeout(()=>$('#studentName').focus(),60);
  }
  function closeStudentModal() { $('#studentModal').classList.remove('open'); $('#studentModal').setAttribute('aria-hidden','true'); }

  function handleStudentSubmit(event) {
    event.preventDefault();
    const id = $('#editStudentId').value;
    const name = $('#studentName').value.trim();
    const email = $('#studentEmail').value.trim();
    const course = $('#studentCourse').value;
    const semester = Number($('#studentSemester').value);
    const phone = $('#studentPhone').value.trim();
    const date = $('#studentDate').value;
    const duplicate = students.some(s => s.email.toLowerCase()===email.toLowerCase() && s.id!==id);
    if (duplicate) { showFormError('#studentFormMessage','That email address is already in the registry.'); return; }
    if (!name || !email || !course || !semester) { showFormError('#studentFormMessage','Complete all required fields before saving.'); return; }
    if (modalMode === 'edit') {
      const index = students.findIndex(s=>s.id===id);
      if (index<0) { showFormError('#studentFormMessage','This record could not be found.'); return; }
      students[index] = {...students[index],name,email,course,semester,phone,date};
      selectedStudentId = id;
      persist();
      closeStudentModal();
      refreshViews();
      showToast(`${name}'s profile was updated.`);
    } else {
      const student = {id:addStudentNumber(),name,email,course,semester,phone,date,createdAt:Date.now(),marks:Array(SUBJECTS.length).fill(null)};
      students.push(student);
      selectedStudentId = student.id;
      activeResultId = student.id;
      persist();
      closeStudentModal();
      refreshViews();
      showToast(`${name} was added to the registry.`);
    }
  }
  function showFormError(selector, message) { const node=$(selector);node.textContent=message;node.className='form-message error'; }

  function renderResultsView() {
    const selector=$('#resultStudent');
    const previous = activeResultId;
    selector.innerHTML = students.length ? students.slice().sort((a,b)=>a.name.localeCompare(b.name)).map(s=>`<option value="${esc(s.id)}">${esc(s.name)} · ${esc(s.id)}</option>`).join('') : '<option value="">No student records</option>';
    if (students.some(s=>s.id===previous)) selector.value=previous;
    else { activeResultId=students[0]?.id || null; selector.value=activeResultId || ''; }
    selector.disabled = students.length===0;
    $('#resultsForm button[type="submit"]').disabled=students.length===0;
    renderMarksInputs();
  }
  function renderMarksInputs() {
    const student = students.find(s=>s.id===activeResultId);
    $('#resultMessage').textContent='';
    if (!student) {
      $('#resultStudentPreview').innerHTML='<div style="font-size:11px;color:#8f988e">Add a student before recording results.</div>';
      $('#marksInputs').innerHTML='';
      renderResultPreview(null,Array(SUBJECTS.length).fill(null));
      return;
    }
    const r=calc(student);
    $('#resultStudentPreview').innerHTML=`${initialsHTML(student.name)}<div><strong>${esc(student.name)}</strong><small>${esc(student.course)} · Sem ${esc(student.semester)} · ${esc(student.id)}</small></div><div class="mini-overall">${r.validCount?`${r.percent}%`:'—'}</div>`;
    $('#marksInputs').innerHTML=SUBJECTS.map((subject,index)=>`<div class="mark-input-row"><span class="subject-color"></span><label for="mark-${index}">${esc(subject)}</label><small> / 100</small><input id="mark-${index}" name="mark-${index}" aria-label="${esc(subject)} marks" type="number" min="0" max="100" step="1" value="${student.marks[index]===null?'':student.marks[index]}" placeholder="—" required></div>`).join('');
    $$('#marksInputs input').forEach(input=>input.addEventListener('input',()=>updateResultPreviewFromInputs()));
    renderResultPreview(student,student.marks);
  }
  function readMarkInputs() {
    return SUBJECTS.map((_,index)=>{
      const input=$(`#mark-${index}`);
      if (!input || input.value.trim()==='') return null;
      const n=Number(input.value);
      return Number.isFinite(n) ? Math.min(100,Math.max(0,n)) : null;
    });
  }
  function updateResultPreviewFromInputs() {
    const marks=readMarkInputs();
    const temp={marks};
    renderResultPreview(temp,marks);
  }
  function renderResultPreview(student, marks) {
    const valid=marks.filter(v=>v!==null && v!==undefined);
    const total=valid.reduce((sum,v)=>sum+Number(v),0);
    const avg=valid.length?total/valid.length:0;
    const complete=valid.length===SUBJECTS.length;
    const passed=complete && marks.every(v=>v>=40);
    const grade=gradeFor(avg,valid.length);
    $('#resultPreview').innerHTML=`<div class="result-grade-ring" style="--grade-angle:${avg}%"><div><strong>${valid.length?`${Math.round(avg)}%`:'—'}</strong><small>${complete?'FINAL AVERAGE':'LIVE AVERAGE'}</small></div></div><div class="result-summary-grid"><div class="result-summary-box"><strong>${valid.length?total:'—'}</strong><small>TOTAL / 500</small></div><div class="result-summary-box"><strong>${grade}</strong><small>GRADE</small></div><div class="result-summary-box"><strong>${valid.length}/${SUBJECTS.length}</strong><small>SUBJECTS</small></div></div><div class="result-status ${complete&&!passed?'fail':''}">${!valid.length?'○ Waiting for marks':!complete?'◷ Add remaining marks':passed?'✓ PASS · all subjects meet 40%':'! REVIEW · one or more subjects below 40%'}</div>`;
  }
  function saveResults(event) {
    event.preventDefault();
    const student=students.find(s=>s.id===activeResultId);
    if (!student) { showToast('Add a student before saving results.','error'); return; }
    const inputs=$$('#marksInputs input');
    for (const input of inputs) {
      const value=input.value.trim();
      if (value==='' || !Number.isFinite(Number(value)) || Number(value)<0 || Number(value)>100) {
        showFormError('#resultMessage','Enter a whole-number mark from 0 to 100 for every subject.'); input.focus(); return;
      }
    }
    const values=inputs.map(input=>Number(input.value));
    if (values.some(value=>!Number.isInteger(value))) { showFormError('#resultMessage','Use whole-number marks for this grading setup.'); return; }
    student.marks=values;
    persist();
    renderMarksInputs();
    refreshViews();
    showToast(`Results saved for ${student.name}.`);
  }

  function renderAnalytics() {
    const m=metrics();
    const full=students.filter(s=>calc(s).complete);
    const average=m.classAverage;
    const failing=full.filter(s=>!calc(s).passed).length;
    const kpis=[
      {label:'CLASS AVERAGE',value:`${Math.round(average)}%`,note:'Mean across recorded marks'},
      {label:'COHORT PASS RATE',value:`${m.passRate}%`,note:`${m.passes} of ${full.length} complete results`},
      {label:'RESULTS COMPLETE',value:`${full.length}/${students.length}`,note:'All subject marks recorded'},
      {label:'FLAGGED FOR REVIEW',value:failing,note:'At least one subject below 40'}
    ];
    $('#analyticsMetrics').innerHTML=kpis.map(k=>`<article class="analytics-kpi"><span>${k.label}</span><strong>${k.value}</strong><small>${k.note}</small></article>`).join('');
    const subjectValues=SUBJECTS.map((subject,index)=>{
      const vals=students.map(s=>normalizeMarks(s.marks)[index]).filter(v=>v!==null);
      return {subject,average:vals.length?vals.reduce((a,b)=>a+b,0)/vals.length:0,count:vals.length};
    });
    $('#subjectChart').innerHTML=subjectValues.map(item=>`<div class="subject-bar-row"><span class="subject-bar-name" title="${esc(item.subject)}">${esc(item.subject)}</span><div class="subject-bar-track"><div class="subject-bar-fill" style="width:${item.average}%"></div></div><span class="subject-bar-value">${item.count?Math.round(item.average):'—'}%</span></div>`).join('');
    const gradeCounts={A:0,B:0,C:0,D:0,F:0};
    full.forEach(s=>{const g=calc(s).grade;if(gradeCounts[g]!==undefined)gradeCounts[g]++;});
    const max=Math.max(1,...Object.values(gradeCounts));
    $('#gradeDistribution').innerHTML=Object.entries(gradeCounts).map(([grade,count])=>`<div class="distribution-row"><span class="distribution-grade">${grade}</span><div class="distribution-track"><span style="width:${count/max*100}%"></span></div><span class="distribution-number">${count}</span></div>`).join('');
    const partial=students.filter(s=>!calc(s).complete).length;
    $('#cohortHealth').innerHTML=[
      {icon:'✓',value:m.passes,label:'Students passing all subjects'},
      {icon:'◷',value:partial,label:'Results still in progress'},
      {icon:'!',value:failing,label:'Completed results needing review'}
    ].map(x=>`<div class="health-tile"><span class="health-icon">${x.icon}</span><div><strong>${x.value}</strong><small>${x.label}</small></div></div>`).join('');
  }

  function refreshViews() {
    renderOverview();
    if (currentView==='students') renderStudents();
    if (currentView==='results') renderResultsView();
    if (currentView==='analytics') renderAnalytics();
    if (currentView!=='students') renderStudentDetail(selectedStudentId);
  }

  function showToast(message, type='success') {
    const stack=$('#toastStack');
    const node=document.createElement('div');
    node.className='toast';
    node.innerHTML=`<span class="toast-mark" style="${type==='error'?'background:#ffb6a0;color:#502f23':''}">${type==='error'?'!':'✓'}</span><span>${esc(message)}</span>`;
    stack.appendChild(node);
    window.setTimeout(()=>{node.classList.add('out');window.setTimeout(()=>node.remove(),310);},3000);
  }

  function csvEscape(value) { const text=String(value??''); return `"${text.replace(/"/g,'""')}"`; }
  function downloadFile(filename, content, type='text/csv;charset=utf-8;') {
    const blob=new Blob(['\ufeff',content],{type});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);
  }
  function exportStudents() {
    const headers=['Student ID','Full Name','Email','Phone','Programme','Semester','Enrolment Date',...SUBJECTS,'Total Marks','Percentage','Grade','Status'];
    const rows=students.map(s=>{const r=calc(s);return [s.id,s.name,s.email,s.phone,s.course,s.semester,s.date,...r.marks.map(v=>v??''),r.validCount?r.total:'',r.validCount?fmtAverage(r.average):'',r.grade,statusFor(s).label];});
    downloadFile('meridian-student-registry.csv',[headers,...rows].map(row=>row.map(csvEscape).join(',')).join('\r\n'));
    showToast('Registry exported as CSV.');
  }
  function exportAnalytics() {
    const m=metrics();
    const full=students.filter(s=>calc(s).complete);
    const lines=[
      'MERIDIAN ACADEMIC PERFORMANCE REPORT',
      `Generated,${new Date().toLocaleString('en-IN')}`,
      `Total students,${m.total}`,
      `Students with results,${m.withResults}`,
      `Class average,${fmtAverage(m.classAverage)}%`,
      `Cohort pass rate,${m.passRate}%`,
      '',
      'SUBJECT PERFORMANCE',
      'Subject,Average mark,Students with marks',
      ...SUBJECTS.map((subject,index)=>{const vals=students.map(s=>normalizeMarks(s.marks)[index]).filter(v=>v!==null);const avg=vals.length?vals.reduce((a,b)=>a+b,0)/vals.length:0;return [csvEscape(subject),csvEscape(vals.length?fmtAverage(avg):'—'),csvEscape(vals.length)].join(',');}),
      '',
      'STUDENT RESULTS',
      ['Student ID','Name','Programme','Semester','Total','Average %','Grade','Status'].map(csvEscape).join(','),
      ...students.map(s=>{const r=calc(s);return [s.id,s.name,s.course,s.semester,r.validCount?r.total:'',r.validCount?fmtAverage(r.average):'',r.grade,statusFor(s).label].map(csvEscape).join(',');})
    ];
    downloadFile('meridian-performance-report.csv',lines.join('\r\n'));
    showToast('Performance report downloaded.');
  }

  function deleteStudent(id) {
    const student=students.find(s=>s.id===id);
    if (!student) return;
    if (!window.confirm(`Remove ${student.name} (${student.id}) from the registry? This also removes their saved results.`)) return;
    students=students.filter(s=>s.id!==id);
    if (selectedStudentId===id) selectedStudentId=students[0]?.id||null;
    if (activeResultId===id) activeResultId=students[0]?.id||null;
    persist();refreshViews();showToast(`${student.name} was removed from the registry.`);
  }

  function inspectStudent(id) {
    selectedStudentId=id;
    if (currentView!=='students') switchView('students'); else renderStudents();
  }

  // Navigation and global actions
  $$('.nav-item').forEach(button=>button.addEventListener('click',()=>switchView(button.dataset.view)));
  $$('[data-view-link]').forEach(button=>button.addEventListener('click',()=>switchView(button.dataset.viewLink)));
  $$('[data-action="add-student"]').forEach(button=>button.addEventListener('click',()=>openStudentModal('add')));
  $('#studentForm').addEventListener('submit',handleStudentSubmit);
  $$('[data-close-modal]').forEach(button=>button.addEventListener('click',closeStudentModal));
  $('#studentModal').addEventListener('click',event=>{if(event.target===$('#studentModal'))closeStudentModal();});
  $('#mobileMenu').addEventListener('click',()=>$('#sidebar').classList.toggle('open'));
  $('#helpButton').addEventListener('click',()=>{$('#infoModal').classList.add('open');$('#infoModal').setAttribute('aria-hidden','false');});
  $('#settingsButton').addEventListener('click',()=>{$('#infoModal').classList.add('open');$('#infoModal').setAttribute('aria-hidden','false');});
  $$('[data-close-info]').forEach(button=>button.addEventListener('click',()=>{$('#infoModal').classList.remove('open');$('#infoModal').setAttribute('aria-hidden','true');}));
  $('#infoModal').addEventListener('click',event=>{if(event.target===$('#infoModal')){$('#infoModal').classList.remove('open');$('#infoModal').setAttribute('aria-hidden','true');}});
  $('#globalSearch').addEventListener('keydown',event=>{if(event.key==='Enter'){switchView('students');$('#studentSearch').value=event.target.value;renderStudents();$('#studentSearch').focus();}});
  $('#globalSearch').addEventListener('input',event=>{if(!event.target.value){if(currentView==='students'){$('#studentSearch').value='';renderStudents();}}});
  document.addEventListener('keydown',event=>{
    if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='k'){event.preventDefault();$('#globalSearch').focus();}
    if(event.key==='Escape'){closeStudentModal();$('#infoModal').classList.remove('open');$('#infoModal').setAttribute('aria-hidden','true');$('#sidebar').classList.remove('open');}
  });
  $('#studentSearch').addEventListener('input',()=>renderStudents());
  $('#courseFilter').addEventListener('change',()=>renderStudents());
  $('#semesterFilter').addEventListener('change',()=>renderStudents());
  $('#exportCsv').addEventListener('click',exportStudents);
  $('#analyticsExport').addEventListener('click',exportAnalytics);
  $('#resultStudent').addEventListener('change',event=>{activeResultId=event.target.value||null;renderMarksInputs();});
  $('#resultsForm').addEventListener('submit',saveResults);
  $('#resetMarks').addEventListener('click',()=>renderMarksInputs());

  $('#studentTableBody').addEventListener('click',event=>{
    const menu=event.target.closest('[data-row-menu]');
    if(menu){event.stopPropagation();const student=students.find(s=>s.id===menu.dataset.rowMenu);if(student)openStudentModal('edit',student);return;}
    const row=event.target.closest('[data-student-row]');
    if(row){selectedStudentId=row.dataset.studentRow;renderStudents();}
  });
  $('#studentTableBody').addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){const row=event.target.closest('[data-student-row]');if(row){event.preventDefault();selectedStudentId=row.dataset.studentRow;renderStudents();}}});
  $('#studentDetail').addEventListener('click',event=>{
    const edit=event.target.closest('[data-edit-student]');
    const results=event.target.closest('[data-edit-results]');
    if(edit){const student=students.find(s=>s.id===edit.dataset.editStudent);if(student)openStudentModal('edit',student);}
    if(results){activeResultId=results.dataset.editResults;switchView('results');}
  });
  $('#recentStudents').addEventListener('click',event=>{const item=event.target.closest('[data-open-student]');if(item)inspectStudent(item.dataset.openStudent);});
  $('#recentStudents').addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){const item=event.target.closest('[data-open-student]');if(item){event.preventDefault();inspectStudent(item.dataset.openStudent);}}});

  // First paint: sample records are only initial demo data. Browser edits persist locally.
  renderOverview();
  renderStudents();
  renderResultsView();
  renderAnalytics();
})();
