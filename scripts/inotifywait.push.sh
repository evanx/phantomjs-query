
  ns='restart'
  file='index.js'
  while true
  do 
    inotifywait $file -qe close_write
    cat $file | redis-cli -x -p 6333 setex $ns:$file 10
    redis-cli -p 6333 lpush $ns:req $file
    redis-cli -p 6333 expire $ns:req 10
  done

