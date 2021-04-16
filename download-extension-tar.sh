cd $3
rm -r -f $1
wget -O temp-ext-file.tar.gz $2
mkdir temp-ext-folder
tar -xf ./temp-ext-file.tar.gz -C temp-ext-folder
rm temp-ext-file.tar.gz
find temp-ext-folder -type d -name "$1*" -exec mv {} ./$1 \;
rm -r -f temp-ext-folder
