set -u -e
mkdir -p tmp
ns='restart'
redis-cli del $ns:req
redis-cli del $ns:adv
while true
do
  file=`redis-cli brpop $ns:req 15 | tail -n +2`
  if [ -n "$file" ]
  then
    redis-cli get $ns:$file > tmp/$file
    redis-cli expire $ns:$file 10
    redis-cli publish $ns:res $file
    redis-cli lpush $ns:res $file
    redis-cli expire $ns:res 10
    ls -l tmp/$file
    head tmp/$file
    echo $ns:adv $file 
  fi
done
