FROM fossology/fossology:3.11.0

RUN apt-get update -y && apt-get install python3 python3-pip -y

RUN pip3 install fossology requests