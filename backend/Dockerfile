# 第1步: 选择基础镜像
# public.ecr.aws/lambda/python:3.11 是AWS官方提供的Python Lambda镜像
# 就像买房子选择"毛坯房"还是"精装房",这个是专门为Lambda设计的
FROM public.ecr.aws/lambda/python:3.11

# 第2步: 设置工作目录
# ${LAMBDA_TASK_ROOT} 是Lambda的特殊目录,代码要放这里
WORKDIR ${LAMBDA_TASK_ROOT}

# 第3步: 复制依赖列表
# 先只复制requirements.txt,这样如果代码改了但依赖没变,Docker可以用缓存
COPY requirements.txt .

# 第4步: 安装依赖
# --no-cache-dir: 不保存缓存,减小镜像大小
# --upgrade pip: 先升级pip到最新版
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# 第5步: 复制应用代码
# 把app文件夹和lambda_handler.py复制进去
COPY app/ ${LAMBDA_TASK_ROOT}/app/
COPY lambda_handler.py ${LAMBDA_TASK_ROOT}/

# 第6步: 告诉Lambda运行哪个函数
# "lambda_handler.handler" 意思是:
#   - lambda_handler: 文件名(lambda_handler.py)
#   - handler: 函数名(文件里的handler变量)
CMD ["lambda_handler.handler"]