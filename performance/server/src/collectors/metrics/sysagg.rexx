/* REXX */trace O
rc=isfcalls('ON')
/* Cool down a little otherwise CPUPR will always show 100% */
call sleep 3
/* Access the SYS panel */
Address SDSF "ISFEXEC SYS"
ISFCOLS = 'CPUPR SIO REAL AUXPCT CSAPCT SQAPCT ECSAPCT ESQAPCT SPOOLPCT'
if rc<>0 then
  Exit rc
/* Process total value */
say "["
do ix=1 to isfrows
  /* List all values for system */
  do jx=1 to words(isfcols)
    colsel = word(isfcols,jx)
    if jx=9 then
      say '{"key":"'colsel'","value":"'value(colsel"."ix)'"}'
    else
      say '{"key":"'colsel'","value":"'value(colsel"."ix)'"},'
  end
end
rc=isfcalls('OFF')
say "]"
exit 0
