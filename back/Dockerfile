FROM python:latest



COPY . /app
WORKDIR /app
RUN pip install -r requirements.txt

EXPOSE 8000

CMD ["gunicorn", "-b", "0.0.0.0:8000" , "pgsim:create_app()"]

# RUN python /flask_stuff/run.py
