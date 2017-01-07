

set -u 

  for key in `redis-cli keys "$ns:*:s"`
  do 
    echo $key
    redis-cli smembers $key
    echo
  done 

  for key in `redis-cli keys "$ns:*:h"`
  do 
    echo $key
    redis-cli hgetall $key
    echo
  done 
