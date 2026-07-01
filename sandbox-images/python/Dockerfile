FROM python:3.12-slim
RUN useradd -r -u 1000 -m sandbox
RUN rm -rf /usr/lib/python3/dist-packages/pip* /usr/bin/pip* 2>/dev/null || true
WORKDIR /code
USER sandbox
CMD ["python3"]
