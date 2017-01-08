
if [ $# -eq 1 ]
then
  message="$1"
else 
  message=${message-update}
fi

  git add -A
  git commit -m "$message"
  git push

