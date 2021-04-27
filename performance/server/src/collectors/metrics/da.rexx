/* REXX */trace O
rc = isfcalls('ON')
/* Access the DA panel */
ISFPREFIX = '*'
ISFOWNER = '*'
Address SDSF "ISFEXEC DA"
ISFCOLS = 'JNAME JOBID REAL PAGING CPUPR CPU ZIIPTIME ZIIPUSE'
if rc<>0 then
  Exit rc
/* Get fixed field name from first word */
/* of isfcols special variable          */
colJname = word(isfcols,1)
colJobId = word(isfcols,2)
/* say "Number of jobs processed:" isfrows */
/* Process all jobs */
say "["
do ix=1 to isfrows
  /* say "-----------------------------------" */
  /* say "Processing JOB:" value(colJname"."ix) */
  /* List all columns for job */
  do jx=3 to words(isfcols)
    colsel = word(isfcols,jx)
    if ix=isfrows & jx=8 then
      say '{"key":"'colsel'","process":"'value(colJname"."ix)'","jobid":"'value(colJobId"."ix)'","value":',
        value(colsel"."ix)'}'
    else
      say '{"key":"'colsel'","process":"'value(colJname"."ix)'","jobid":"'value(colJobId"."ix)'","value":',
        value(colsel"."ix)'},'
  end
end
rc=isfcalls('OFF')
say "]"
exit 0
