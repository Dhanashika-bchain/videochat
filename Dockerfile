# Use the official PHP image
FROM php:8.1-cli

# Set the working directory
WORKDIR /app

# Copy all files to the container
COPY . /app

# Install dependencies using Composer (if composer.json exists)
RUN apt-get update && \
    apt-get install -y libuv1-dev && \
    docker-php-ext-install sockets && \
    if [ -f "composer.json" ]; then \
      curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer && \
      composer install; \
    fi

# Expose the PORT environment variable for Render
ENV PORT=8080

# Run the WebSocket server
CMD ["php", "server.php"]
