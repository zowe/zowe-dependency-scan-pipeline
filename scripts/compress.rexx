/* REXX */
parse arg dsarg

parse var dsarg dataset
trace 'o'
if LENGTH(dataset) == 0 then do
    say 'You must supply this script with a dataset to compress'
    say 'e.g.: ./compress.rexx "YOUR.DATASET"'
    exit 1 
end

say 'Compressing 'dataset

address TSO
"ALLOC FI(SYSUT1) DSN('"dataset"') SHR"
"ALLOC FI(SYSUT2) DSN('"dataset"') SHR"
"ALLOC FI(SYSPRINT) DUMMY"
"ALLOC FI(SYSIN) UNIT(VIO) SPACE(15) BLKSIZE(80) LRECL(80) ",
     "RECFM(F B) DSORG(PS) NEW DELETE REUSE"
"NEWSTACK"
QUEUE  '    COPY OUTDD=SYSUT2,INDD=SYSUT1'
"EXECIO" QUEUED() "DISKW SYSIN (Finis "
"DELSTACK"
"CALL *(IEBCOPY)"
HIGHRC = RC
"FREE FI(SYSUT1 SYSUT2 SYSIN)"
if HIGHRC > 4 then do
    say 'Compression failed, IEBCOPY RC='HIGHRC
    exit HIGHRC
end

say 'Compression complete'
exit 0
