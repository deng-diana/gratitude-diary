# AWS 官方 Lambda Python 运行时
FROM public.ecr.aws/lambda/python:3.11

# /var/task 已经是 LAMBDA_TASK_ROOT，显式声明无妨
WORKDIR ${LAMBDA_TASK_ROOT}

# 只拷贝依赖清单以利用缓存
COPY requirements.txt .

# 安装依赖（尽量减小体积）
RUN pip install --no-cache-dir --upgrade pip \
 && pip install --no-cache-dir -r requirements.txt

# 拷贝源码
COPY app/ ./app/
COPY lambda_handler.py ./

# 入口：文件名.lambda函数名
CMD ["lambda_handler.handler"]