cd $3
rm -r -f $1
wget -O temp-ext-file.zip $2
unzip temp-ext-file.zip -d temp-ext-folder
rm temp-ext-file.zip
find temp-ext-folder -type d -name "$1*" -exec mv {} ./$1 \;
rm -r -f temp-ext-folder
