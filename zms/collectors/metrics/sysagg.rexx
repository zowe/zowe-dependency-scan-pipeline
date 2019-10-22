/* REXX */trace O
rc=isfcalls('ON')
/* Access the SYS panel */
Address SDSF "ISFEXEC SYS"
ISFCOLS = 'CPUPR SIO REAL'
if rc<>0 then
  Exit rc
/* Process total value */
say "["
do ix=1 to isfrows
/* List all values for system */
 do jx=1 to words(isfcols)
   colsel = word(isfcols,jx)
   if jx=3 then
     say '{"key":"'colsel'","value":"'value(colsel"."ix)'"}'
   else
     say '{"key":"'colsel'","value":"'value(colsel"."ix)'"},'
 end
end
 rc=isfcalls('OFF')
 say "]"
 exit
