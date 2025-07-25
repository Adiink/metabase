FROM metabase/metabase:v0.49.13

# Set environment variables
ENV FC_LANG=en-US LC_CTYPE=en_US.UTF-8
ENV JAVA_TOOL_OPTIONS=-Xmx256m

# Optionally set the Git commit SHA
ARG GIT_COMMIT_SHA
ENV GIT_COMMIT_SHA=${GIT_COMMIT_SHA}

# Install fonts, curl, and CA certs
RUN apt-get update && apt-get install -y \
    bash curl fontconfig ca-certificates \
    fonts-noto fonts-noto-cjk fonts-noto-color-emoji && \
    rm -rf /var/lib/apt/lists/* && \
    mkdir -p /app/certs && \
    curl https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem -o /app/certs/rds-combined-ca-bundle.pem && \
    keytool -noprompt -import -trustcacerts -alias aws-rds -file /app/certs/rds-combined-ca-bundle.pem \
    -keystore /etc/ssl/certs/java/cacerts -keypass changeit -storepass changeit && \
    curl https://cacerts.digicert.com/DigiCertGlobalRootG2.crt.pem -o /app/certs/DigiCertGlobalRootG2.crt.pem && \
    keytool -noprompt -import -trustcacerts -alias azure-cert -file /app/certs/DigiCertGlobalRootG2.crt.pem \
    -keystore /etc/ssl/certs/java/cacerts -keypass changeit -storepass changeit && \
    mkdir -p /plugins && chmod a+rwx /plugins

# Expose Metabase default port
EXPOSE 3000
