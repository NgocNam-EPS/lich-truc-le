import json,os
ui=open('ui2.html').read()
org=json.load(open('org_seed.json'))
# bản công khai: bỏ tên, SĐT trong sơ đồ; chỉ giữ khung
blank={'company':org['company'],'gd':{'role':org['gd']['role'],'text':''},'pgd':[{'role':x['role'],'text':''} for x in org['pgd']],
 'groups':[{'role':g['role'],'people':[]} for g in org['groups']],'sodoTop':[],'sodoKT':'','key':{},'limits':org['limits'],'hours':org['hours'],'titles':{}}
patches=[
 ("S.tab !== 'holiday' && S.tab !== 'accounts'","S.tab !== 'holiday' && S.tab !== 'accounts' && S.tab !== 'data'"),
 ('/*STAFF*/[]','[]'),('/*ORG*/{}',json.dumps(blank,ensure_ascii=False)),('/*XW*/',open('xw.js').read()),('/*CORE*/',open('core2.js').read()),
 ("${S.me.role !== 'owner' ? '<button class=\"btn sm\" data-act=\"logout\">","${S.me.role !== 'owner' || typeof IS_WEB !== 'undefined' ? '<button class=\"btn sm\" data-act=\"logout\">"),
 ("...(S.me.role === 'owner' ? [['accounts', 'Tài khoản']] : [])","...(S.me.role === 'owner' ? [['accounts', 'Tài khoản'], ['data', 'Dữ liệu']] : [])"),
 ("case 'accounts': return S.me.role === 'owner' ? viewAccounts() : viewOverview();","case 'accounts': return S.me.role === 'owner' ? viewAccounts() : viewOverview(); case 'data': return S.me.role === 'owner' ? viewData() : viewOverview();"),
 ("\nboot();\n</script>","\n</script>"),
 ("at: Date.now() };\n      S.files[doc.id] = doc;","at: Date.now(), uid: window.CURRENT_UID || null };\n      S.files[doc.id] = doc;"),
 ('<title>Lịch trực lễ EPS</title>\n<meta name="claude:viewport-fit-sides" content="cover">','<!doctype html>\n<html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n<title>Lịch trực lễ EPS</title><style>[hidden]{display:none!important}body{margin:0}</style>'),
 ("</style>\n\n<header","</style>\n</head><body>\n<header"),
]
for a,b in patches:
  assert a in ui,a[:60]; ui=ui.replace(a,b,1)
ui=ui.rstrip()+"""
<script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-auth-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore-compat.js"></script>
<script src="firebase-config.js"></script>
<script>
"""+open('web.js').read()+"""
</script>
</body></html>
"""
os.makedirs('web',exist_ok=True); open('web/index.html','w').write(ui); print(len(ui))
