resource "aws_internet_gateway" "fenix" {
  vpc_id = aws_vpc.fenix.id

  tags = {
    Name = "fenix-igw"
  }
}

resource "aws_route_table" "internet" {
  vpc_id = aws_vpc.fenix.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.fenix.id
  }

  tags = {
    Name = "fenix-public-rt"
  }
}

resource "aws_route_table_association" "frontend" {
  for_each = aws_subnet.public

  subnet_id      = each.value.id
  route_table_id = aws_route_table.internet.id
}